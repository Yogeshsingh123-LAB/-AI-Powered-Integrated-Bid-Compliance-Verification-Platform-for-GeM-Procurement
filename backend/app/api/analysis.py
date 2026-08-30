import os
import re
import uuid
import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, File, Form, UploadFile, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.ai_engine import DocumentAnalyzer
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
    3. Queries mock registries for validation (GST, PAN, Udyam, Blacklist).
    4. Evaluates multi-bidder identifier reuse & cross-bidder collusion risk.
    5. Computes compliance scoring, risk classification, and recommendations.
    6. Stores audit log with optional authenticated user context.
    7. Returns consolidated compliance & integrity report.
    """
    logger.info(f"Analysis Endpoint: Received file '{file.filename}' for compliance verification.")
    
    # 1. Read file bytes, enforce size limit, and save with sanitized filename
    try:
        file_bytes = await file.read()
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
        
    # 3. Query Mock Government Registries
    try:
        identifiers = analysis_result.get("identifiers", {"gstin": [], "pan": [], "udyam": []})
        verification_results = MockVerifier.verify_all_identifiers(identifiers)
    except Exception as e:
        logger.error(f"Analysis Endpoint: Verification registry query error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registry database verification queries failed: {str(e)}"
        )

    # 4. Multi-Bidder Fraud & Collusion Detection
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
        
    # 5. Perform Compliance Scoring and Risk Assessment
    try:
        forgery_analysis = analysis_result.get("forgery_analysis", {})
        score_result = ComplianceScorer.calculate_compliance_score(
            verification_results=verification_results,
            forgery_analysis=forgery_analysis,
            fraud_analysis=fraud_analysis
        )
    except Exception as e:
        logger.error(f"Analysis Endpoint: Score calculation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Compliance score calculations failed: {str(e)}"
        )
        
    # 6. Log audit record
    try:
        create_audit_record(
            db=db,
            action="DOCUMENT_ANALYSIS",
            user_id=current_user.id if current_user else None,
            entity_type="Document",
            new_value=f"Filename: {file.filename}, Score: {score_result['score']}, Risk: {score_result['risk_level']}, ForgeryScore: {forgery_analysis.get('forgery_score', 100)}"
        )
    except Exception as e:
        logger.error(f"Analysis Endpoint: Failed to save audit log: {e}")
        
    # 7. Return response
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
            "fraud_analysis": fraud_analysis
        },
        "verification": verification_results,
        "compliance": score_result
    }

