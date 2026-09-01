import re
import logging
from datetime import datetime, timezone
import uuid
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import Document
from app.models.document_ocr import DocumentOCR
from app.models.document_extraction import DocumentExtraction
from app.services.storage_service import StorageService
from app.services.ocr_service import OCRService
from app.services.document_classifier import DocumentClassifier
from app.services.ai_extraction_service import AIExtractionService
from app.services.auth_service import create_audit_record

logger = logging.getLogger(__name__)

def process_document(db: Session, document_id: uuid.UUID, user_id: Optional[uuid.UUID] = None) -> Document:
    """
    Main function to process an uploaded document:
    1. Fetch metadata.
    2. Transition status: UPLOADED -> PROCESSING.
    3. Download from Supabase.
    4. Transition status: TEXT_EXTRACTION.
    5. Extract text (digital or OCR).
    6. Transition status: DOCUMENT_CLASSIFICATION.
    7. Classify document type.
    8. Transition status: FIELD_EXTRACTION.
    9. Extract schema fields.
    10. Transition status: VALIDATION.
    11. Save OCR and Extraction results.
    12. Transition status: PROCESSED, REQUIRES_REVIEW, or PROCESSING_FAILED.
    13. Log audit events.
    """
    logger.info(f"Starting processing pipeline for document: {document_id}")
    
    # 1. Fetch document
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        logger.error(f"Document {document_id} not found in database.")
        raise ValueError(f"Document {document_id} not found.")

    try:
        # 2. Transition status to PROCESSING
        doc.document_status = "PROCESSING"
        db.commit()
        
        create_audit_record(
            db=db,
            action="DOCUMENT_PROCESSING_STARTED",
            user_id=user_id or doc.uploaded_by,
            entity_type="Document",
            entity_id=doc.id,
            bid_id=doc.bid_id,
            new_value=f"Started processing document: {doc.original_filename}"
        )

        # 3. Transition to TEXT_EXTRACTION
        doc.document_status = "TEXT_EXTRACTION"
        db.commit()

        # Download from storage
        logger.info(f"Downloading file from path: {doc.storage_path}")
        file_bytes = StorageService.download_file(doc.storage_path)

        # Extract text
        ext_res = OCRService.extract_text_with_ocr(file_bytes, doc.mime_type)
        if not ext_res["success"]:
            raise Exception(f"Text extraction failed: {ext_res.get('error')}")

        extracted_text = ext_res["text"]

        # 4. Save OCR record if OCR was used
        if ext_res.get("ocr_used") or ext_res.get("ocr_engine") == "tesseract":
            ocr_record = DocumentOCR(
                document_id=doc.id,
                ocr_text=extracted_text,
                ocr_engine=ext_res.get("ocr_engine", "tesseract"),
                ocr_confidence=ext_res.get("ocr_confidence", 0.85),
                page_count=ext_res.get("page_count", 1)
            )
            db.add(ocr_record)
            db.commit()
            
            create_audit_record(
                db=db,
                action="OCR_COMPLETED",
                user_id=user_id or doc.uploaded_by,
                entity_type="Document",
                entity_id=doc.id,
                bid_id=doc.bid_id,
                new_value=f"OCR completed using {ocr_record.ocr_engine}. Pages: {ocr_record.page_count}"
            )

        # 5. Transition to DOCUMENT_CLASSIFICATION
        doc.document_status = "DOCUMENT_CLASSIFICATION"
        db.commit()

        classification = DocumentClassifier.classify(extracted_text)
        detected_type = classification["document_type"]
        class_conf = classification["confidence"]

        create_audit_record(
            db=db,
            action="DOCUMENT_CLASSIFIED",
            user_id=user_id or doc.uploaded_by,
            entity_type="Document",
            entity_id=doc.id,
            bid_id=doc.bid_id,
            new_value=f"Classified document as {detected_type} (confidence: {class_conf})"
        )

        # Update document type to the AI classified type
        doc.document_type = detected_type
        db.commit()

        # 6. Transition to FIELD_EXTRACTION
        doc.document_status = "FIELD_EXTRACTION"
        db.commit()

        # Extract structured data
        extraction_res = AIExtractionService.extract_fields(extracted_text, detected_type)
        
        create_audit_record(
            db=db,
            action="FIELDS_EXTRACTED",
            user_id=user_id or doc.uploaded_by,
            entity_type="Document",
            entity_id=doc.id,
            bid_id=doc.bid_id,
            new_value=f"Fields extracted for schema: {detected_type}"
        )

        # 7. Transition to VALIDATION & Expected Requirement Verification
        doc.document_status = "VALIDATION"
        db.commit()

        # Fetch Requirement record for expected document type comparison
        from app.models.requirement import Requirement
        from app.models.bid import Bid
        from app.services.notification_service import create_notification
        
        req = db.query(Requirement).filter(Requirement.id == doc.requirement_id).first()
        bid = db.query(Bid).filter(Bid.id == doc.bid_id).first()
        req_code = req.code.upper() if req and req.code else "GENERAL"
        req_title = req.description or req.code or "Required Document"

        text_lower = extracted_text.lower()
        EXPECTED_DOC_TYPES = {
            "GST": ["GST_CERTIFICATE", "GST_RETURN"],
            "PAN": ["PAN", "INCOME_TAX"],
            "UDYAM": ["UDYAM"],
            "MSME": ["UDYAM"],
            "ITR": ["INCOME_TAX", "PAN"],
            "EPFO": ["EPFO"],
            "ESIC": ["ESIC"],
            "STARTUP_INDIA": ["STARTUP_INDIA"],
            "NSIC": ["NSIC"],
            "OEM": ["OEM_AUTHORIZATION"],
            "MAKE_IN_INDIA": ["MAKE_IN_INDIA"],
            "BIS": ["BIS"],
            "AADHAAR": ["AADHAAR"],
            "EMD": ["EMD", "BANK_GUARANTEE"],
            "EPBG": ["EPBG", "BANK_GUARANTEE"],
            "DECLARATION": ["BLACKLIST_DECLARATION", "MAKE_IN_INDIA"],
            "NON_BLACKLISTING": ["BLACKLIST_DECLARATION"]
        }

        allowed_types = EXPECTED_DOC_TYPES.get(req_code, [req_code, "OTHER"])
        is_valid_type = False
        rejection_reason = None

        if detected_type in allowed_types:
            is_valid_type = True
        else:
            # Keyword/Identifier fallback checks specific to req_code
            if req_code == "GST" and (re.search(r"\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z0-9]{3}", extracted_text) or any(k in text_lower for k in ["gstin", "goods and services tax", "form gst-reg"])):
                is_valid_type = True
            elif req_code == "PAN" and (re.search(r"\b[A-Z]{5}\d{4}[A-Z]{1}\b", extracted_text) or any(k in text_lower for k in ["permanent account number", "income tax department", "pan card"])):
                is_valid_type = True
            elif req_code in {"UDYAM", "MSME"} and (re.search(r"udyam-[a-z]{2}-\d{2}-\d{7}", text_lower) or any(k in text_lower for k in ["udyam", "msme", "micro, small"])):
                is_valid_type = True
            elif req_code == "OEM" and any(k in text_lower for k in ["oem", "authorization", "manufacturer", "authorized bidder"]):
                is_valid_type = True
            elif req_code == "MAKE_IN_INDIA" and any(k in text_lower for k in ["make in india", "local content", "class-i", "class-ii"]):
                is_valid_type = True
            elif req_code == "EPFO" and any(k in text_lower for k in ["epfo", "provident fund"]):
                is_valid_type = True
            elif req_code == "ESIC" and any(k in text_lower for k in ["esic", "state insurance"]):
                is_valid_type = True
            elif req_code in {"DECLARATION", "NON_BLACKLISTING"} and any(k in text_lower for k in ["blacklisted", "debarred", "declaration"]):
                is_valid_type = True

        if not is_valid_type:
            # Document classification mismatch -> REJECTED
            final_status = "REJECTED"
            rejection_reason = f"Uploaded document ({doc.original_filename}) appears to be a {detected_type.replace('_', ' ').title()}, which does not match the required {req_title} requirement."
        else:
            # Document type matches! Evaluate OCR extraction confidence
            overall_conf = extraction_res.get("confidence", 0.85)
            requires_review = extraction_res.get("requires_review", False)
            
            # If text extraction was empty or low confidence, mark as REQUIRES_REVIEW (NOT REJECTED!)
            if len(extracted_text.strip()) < 15 or overall_conf < 0.65 or requires_review:
                final_status = "REQUIRES_REVIEW"
                rejection_reason = None
            else:
                final_status = "VERIFIED"
                rejection_reason = None

        # 8. Save structured extraction
        extraction_record = DocumentExtraction(
            document_id=doc.id,
            document_type=detected_type,
            extracted_data=extraction_res.get("fields", {}),
            raw_text=extracted_text,
            confidence_score=overall_conf,
            processing_status=final_status,
            model_name=settings.AI_MODEL
        )
        db.add(extraction_record)
        
        # 9. Update final document status & rejection reason
        doc.document_status = final_status
        doc.rejection_reason = rejection_reason

        # 10. Generate persistent database notification for bidder
        try:
            target_user_id = user_id or doc.uploaded_by or (bid.bidder_id if bid else None)
            tender_num = bid.tender.id if (bid and bid.tender) else "CPCL/2026/003"
            if target_user_id:
                if final_status == "REJECTED":
                    create_notification(
                        db=db,
                        user_id=target_user_id,
                        tender_id=bid.tender_id if bid else None,
                        bid_id=doc.bid_id,
                        document_id=doc.id,
                        type="DOCUMENT_REJECTED",
                        title="Document Rejected",
                        message=f"Your {req_title} submission ({doc.original_filename}) for Tender {tender_num} was rejected because the uploaded file does not match the required document type."
                    )
                elif final_status == "VERIFIED":
                    create_notification(
                        db=db,
                        user_id=target_user_id,
                        tender_id=bid.tender_id if bid else None,
                        bid_id=doc.bid_id,
                        document_id=doc.id,
                        type="DOCUMENT_VERIFIED",
                        title="Document Verified",
                        message=f"Your {req_title} submission ({doc.original_filename}) for Tender {tender_num} was verified successfully."
                    )
                elif final_status == "REQUIRES_REVIEW":
                    create_notification(
                        db=db,
                        user_id=target_user_id,
                        tender_id=bid.tender_id if bid else None,
                        bid_id=doc.bid_id,
                        document_id=doc.id,
                        type="DOCUMENT_REQUIRES_REVIEW",
                        title="Document Pending Manual Review",
                        message=f"Your {req_title} submission ({doc.original_filename}) for Tender {tender_num} requires manual review by the procurement officer."
                    )
        except Exception as notif_err:
            logger.warning(f"Failed to generate persistent notification: {notif_err}")

        # 11. Recalculate and update associated bid's compliance score based on actual verified documents
        try:
            if bid:
                total_reqs = db.query(Requirement).filter(Requirement.tender_id == bid.tender_id).count()
                verified_docs = db.query(Document).filter(
                    Document.bid_id == bid.id,
                    Document.document_status.in_(["VERIFIED", "PROCESSED"])
                ).count()
                if total_reqs > 0:
                    score = min(100.0, round((verified_docs / max(1, total_reqs)) * 100.0, 2))
                    bid.compliance_score = score
                else:
                    bid.compliance_score = 100.0 if verified_docs > 0 else 0.0
        except Exception as score_err:
            logger.warning(f"Failed to calculate bid compliance score: {score_err}")

        db.commit()
        db.refresh(doc)
        
        logger.info(f"Document {document_id} processed successfully. Final Status: {final_status}")
        return doc

    except Exception as e:
        logger.exception(f"Exception encountered while processing document {document_id}: {e}")
        db.rollback()
        
        # Update status to failed
        try:
            doc.document_status = "PROCESSING_FAILED"
            db.commit()
        except Exception:
            pass

        create_audit_record(
            db=db,
            action="DOCUMENT_PROCESSING_FAILED",
            user_id=user_id or doc.uploaded_by,
            entity_type="Document",
            entity_id=doc.id,
            bid_id=doc.bid_id,
            new_value=f"Processing failed: {str(e)}"
        )
        
        raise

def process_document_background(document_id: uuid.UUID, user_id: Optional[uuid.UUID] = None):
    """Background task wrapper for document processing."""
    from app.db.database import SessionLocal
    db = SessionLocal()
    try:
        process_document(db, document_id, user_id)
    except Exception as e:
        logger.error(f"Background document processing failed for {document_id}: {e}")
    finally:
        db.close()
