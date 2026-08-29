import os
import re
import uuid
import logging
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.ai_engine import DocumentAnalyzer
from app.services.mock_verifier import MockVerifier
from app.scoring import ComplianceScorer
from app.services.auth_service import create_audit_record

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Analysis"])

# Create path for saving uploads locally
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

@router.post("/analyze", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def analyze_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Main analysis endpoint:
    1. Saves uploaded document to the local uploads directory.
    2. Runs the AI OCR text & entity extraction pipeline.
    3. Queries mock registries for validation (GST, PAN, Udyam, Blacklist).
    4. Computes compliance scoring, risk classification, and recommendations.
    5. Stores audit log.
    6. Returns the consolidated compliance report.
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
        
    # 2. Run AI OCR Analysis Pipeline
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
        
    # 4. Perform Compliance Scoring and Risk Assessment
    try:
        score_result = ComplianceScorer.calculate_compliance_score(verification_results)
    except Exception as e:
        logger.error(f"Analysis Endpoint: Score calculation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Compliance score calculations failed: {str(e)}"
        )
        
    # 5. Log audit record
    try:
        create_audit_record(
            db=db,
            action="DOCUMENT_ANALYSIS",
            entity_type="Document",
            new_value=f"Filename: {file.filename}, Score: {score_result['score']}, Risk: {score_result['risk_level']}"
        )
    except Exception as e:
        logger.error(f"Analysis Endpoint: Failed to save audit log: {e}")
        
    # 6. Return response
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
            "entities": analysis_result.get("entities", {})
        },
        "verification": verification_results,
        "compliance": score_result
    }
