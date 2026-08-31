# pyrefly: ignore [missing-import]
import os
import re
import uuid
import logging
from typing import Dict, Any, Optional, List
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, File, Form, UploadFile, status, Body
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.ai_engine import DocumentAnalyzer, SemanticRFPComparator
from app.services.mock_verifier import MockVerifier
from app.scoring import ComplianceScorer
from app.scoring.fraud_detector import ProcurementFraudDetector
from app.services.auth_service import create_audit_record, get_optional_current_user

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Analysis"])

# Create path for saving uploads locally
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/analyze", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def analyze_document(
    file: UploadFile = File(...),
    bidder_name: Optional[str] = Form(None),
    tender_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Main analysis endpoint:
    1. Saves uploaded document to the local uploads directory.
    2. Runs AI OCR text extraction and PDF forgery/metadata anomaly checks.
    3. Evaluates Semantic NLP RFP clause compliance against tender requirements.
    4. Queries mock registries for validation (GST, PAN, Udyam, Blacklist).
    5. Evaluates multi-bidder identifier reuse & cross-bidder collusion risk.
    6. Computes compliance scoring, risk classification, and recommendations.
    7. Stores immutable audit record with cryptographic SHA-256 block hash.
    8. Returns consolidated compliance & integrity report.
    """
    logger.info(f"Analysis Endpoint: Received file '{file.filename}' for compliance verification.")

    # 1. Validate file extension, read bytes, enforce size limit, and save with sanitized filename
    try:
        raw_basename = os.path.basename(file.filename or "upload.pdf")
        ext = os.path.splitext(raw_basename)[1].lower()
        allowed_extensions = {".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".bmp"}
        if ext and ext not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{ext}'. Only PDF documents and image files (PNG, JPG, TIFF) are accepted."
            )

        file_bytes = await file.read()
        if len(file_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty. Please upload a valid bid document."
            )

        if len(file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File size exceeds maximum allowed limit of 10 MB."
            )

        file_id = str(uuid.uuid4())
        raw_basename = os.path.basename(file.filename or "upload.pdf")
        clean_basename = re.sub(r'[^a-zA-Z0-9._-]', '_', raw_basename).strip("._")
        safe_filename = f"{file_id}_{clean_basename}"
        file_path = os.path.join(UPLOAD_DIR, safe_filename)

        with open(file_path, "wb") as f:
            f.write(file_bytes)
        logger.info(f"Analysis Endpoint: Saved file to {file_path}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis Endpoint: Failed to save uploaded file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process and store file upload: {str(e)}"
        )

    # 2. Run AI OCR & Forgery Analysis Pipeline
    try:
        analyzer = DocumentAnalyzer()
        analysis_result = analyzer.analyze_document(file_bytes, file.content_type)
        if not analysis_result["success"]:
            raise ValueError(analysis_result.get("error", "AI Extraction failed."))
    except Exception as e:
        logger.error(f"Analysis Endpoint: Document analyzer error: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"AI document parsing failed: {str(e)}"
        )

    # 3. Perform Semantic NLP RFP Clause Analysis
    extracted_text = analysis_result.get("text", "")
    semantic_analysis = SemanticRFPComparator.evaluate_bid_against_rfp(extracted_text)

    # 4. Query Mock Government Registries
    try:
        identifiers = analysis_result.get("identifiers", {"gstin": [], "pan": [], "udyam": []})
        verification_results = MockVerifier.verify_all_identifiers(identifiers)
    except Exception as e:
        logger.error(f"Analysis Endpoint: Verification registry query error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registry database verification queries failed: {str(e)}"
        )

    # 5. Multi-Bidder Fraud & Collusion Detection
    try:
        effective_bidder_name = bidder_name or (current_user.full_name if current_user else "")
        fraud_analysis = ProcurementFraudDetector.detect_fraud_and_collusion(
            extracted_identifiers=identifiers,
            current_bidder_name=effective_bidder_name,
            verification_data=verification_results,
            db=db,
            tender_id=tender_id
        )
    except Exception as e:
        logger.error(f"Analysis Endpoint: Fraud detection error: {e}")
        fraud_analysis = {"is_collusion_risk": False, "fraud_penalty": 0, "all_warnings": []}

    # 6. Perform Compliance Scoring and Risk Assessment
    try:
        forgery_analysis = analysis_result.get("forgery_analysis", {})
        score_result = ComplianceScorer.calculate_compliance_score(
            verification_results=verification_results,
            forgery_analysis=forgery_analysis,
            fraud_analysis=fraud_analysis,
            semantic_analysis=semantic_analysis
        )
    except Exception as e:
        logger.error(f"Analysis Endpoint: Score calculation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Compliance score calculations failed: {str(e)}"
        )

    # 7. Log audit record
    try:
        create_audit_record(
            db=db,
            action="DOCUMENT_ANALYSIS",
            user_id=current_user.id if current_user else None,
            entity_type="Document",
            new_value=f"Filename: {file.filename}, Score: {score_result['score']}, Risk: {score_result['risk_level']}, ForgeryScore: {forgery_analysis.get('forgery_score', 100)}, SemanticScore: {semantic_analysis.get('semantic_score', 100)}"
        )
    except Exception as e:
        logger.error(f"Analysis Endpoint: Failed to save audit log: {e}")

    # 8. Return response
    return {
        "file_id": file_id,
        "filename": file.filename,
        "analysis": {
            "success": True,
            "ocr_used": analysis_result.get("ocr_used", False),
            "ocr_engine": analysis_result.get("ocr_engine", "tesseract"),
            "ocr_confidence": analysis_result.get("ocr_confidence", 1.0),
            "page_count": analysis_result.get("page_count", 1),
            "identifiers": identifiers,
            "entities": analysis_result.get("entities", {}),
            "forgery_analysis": forgery_analysis,
            "fraud_analysis": fraud_analysis,
            "semantic_analysis": semantic_analysis
        },
        "verification": verification_results,
        "compliance": score_result
    }


@router.post("/analyze/semantic-comparator", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def evaluate_semantic_rfp_comparator(
    payload: Dict[str, Any] = Body(..., example={
        "bid_text": "We are ABC Tech Solutions. Our GSTIN is 27AAPCS1234M1Z5 and PAN is AAPCS1234M. We hold MSME Udyam UDYAM-MH-12-0012345.",
        "rfp_clauses": None
    })
):
    """
    Dedicated Semantic NLP RFP Clause Comparator Endpoint:
    Compares custom bid document text against tender RFP clauses to compute clause-by-clause
    compliance status ('MET', 'PARTIALLY_MET', 'NOT_MET') and extracted evidence snippets.
    """
    bid_text = payload.get("bid_text", "")
    rfp_clauses = payload.get("rfp_clauses", None)

    if not bid_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Field 'bid_text' is required for semantic RFP evaluation."
        )

    evaluation = SemanticRFPComparator.evaluate_bid_against_rfp(
        bid_text=bid_text,
        rfp_clauses=rfp_clauses
    )

    return {
        "status": "success",
        "evaluation": evaluation
    }


@router.post("/analyze/techno-commercial-loading", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def evaluate_techno_commercial_loading(
    payload: Dict[str, Any] = Body(..., example={
        "tender_value": 5000000.0,
        "is_reverse_auction": False,
        "bid_amount": 4800000.0,
        "gstin": "27AAACA12341Z5",
        "pan": "AAACA1234A",
        "technical_score": 85.0,
        "standard_delivery_weeks": 4,
        "offered_delivery_weeks": 6,
        "payment_terms": "Milestone",
        "required_warranty_years": 3,
        "offered_warranty_years": 2
    })
):
    """
    Dedicated GeM 4.0 Techno-Commercial Loading & Procurement Mode Auto-Detection Endpoint:
    Auto-detects mode (Direct, L1, Custom Bid, Reverse Auction) based on tender value,
    computes delivery delay penalties, payment terms loading, warranty gap loading, and loaded price.
    """
    from app.services.tender_analyzer import detect_mode, apply_compliance_rules, check_loading_criteria

    tender_value = float(payload.get("tender_value", 100000.0))
    is_ra = bool(payload.get("is_reverse_auction", False))

    mode = detect_mode(tender_value, is_ra)
    compliance_res = apply_compliance_rules(mode, payload)
    loading_analysis = check_loading_criteria(payload)

    return {
        "status": "success",
        "tender_value": tender_value,
        "mode": mode.value,
        "compliance_eval": compliance_res,
        "techno_commercial_loading": loading_analysis
    }


@router.post("/analyze/validate-emd", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def validate_emd_endpoint(
    payload: Dict[str, Any] = Body(..., example={
        "text": "EARNEST MONEY DEPOSIT (EMD) - State Bank of India Amount: ₹ 50,000.00",
        "tender_value": 2000000.0
    })
):
    """
    Electronic EMD (e-EMD) Validation Endpoint:
    Verifies scheduled bank issuer, minimum 2% EMD amount threshold, and digital signature status.
    """
    from app.services.statutory_checks import validate_emd

    text = str(payload.get("text", payload.get("emd_text", "")))
    tender_value = payload.get("tender_value")
    if tender_value is not None:
        tender_value = float(tender_value)

    res = validate_emd(text, tender_value=tender_value)
    return {
        "status": "success",
        "emd_validation": res
    }


@router.post("/analyze/validate-epbg", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def validate_epbg_endpoint(
    payload: Dict[str, Any] = Body(..., example={
        "text": "PERFORMANCE BANK GUARANTEE (e-PBG) - HDFC Bank Amount: ₹ 150,000.00",
        "tender_value": 3000000.0
    })
):
    """
    Electronic Performance Bank Guarantee (e-PBG) Validation Endpoint:
    Verifies scheduled bank issuer, minimum 3% PBG amount threshold, and digital signature status.
    """
    from app.services.statutory_checks import validate_epbg

    text = str(payload.get("text", payload.get("epbg_text", "")))
    tender_value = payload.get("tender_value")
    if tender_value is not None:
        tender_value = float(tender_value)

    res = validate_epbg(text, tender_value=tender_value)
    return {
        "status": "success",
        "epbg_validation": res
    }


@router.post("/analyze/validate-dsc", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def validate_dsc_endpoint(
    payload: Dict[str, Any] = Body(..., example={
        "pem_cert_data": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
        "pan_number": "AAACA1234A"
    })
):
    """
    Digital Signature Certificate (DSC) Validation Endpoint:
    Verifies X.509 certificate expiry date, effective date, Certifying Authority (CA) status,
    and checks if the Subject Common Name (CN) is linked against the bidder's PAN.
    """
    from app.services.dsc_validator import validate_dsc, generate_sample_dsc_pem

    pem_cert_data = payload.get("pem_cert_data") or payload.get("dsc_pem")
    pan_number = payload.get("pan_number")

    if not pem_cert_data:
        # If no cert data provided, generate sample test DSC for demonstration
        pem_cert_data = generate_sample_dsc_pem(pan_number=pan_number or "AAACA1234A")

    res = validate_dsc(pem_cert_data, pan_number=pan_number)
    return {
        "status": "success",
        "dsc_validation": res
    }
