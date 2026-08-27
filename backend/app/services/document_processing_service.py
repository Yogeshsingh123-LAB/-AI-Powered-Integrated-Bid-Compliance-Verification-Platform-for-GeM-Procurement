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

        # 7. Transition to VALIDATION
        doc.document_status = "VALIDATION"
        db.commit()

        # Determine overall confidence and final status
        overall_conf = extraction_res.get("confidence", 0.90)
        requires_review = extraction_res.get("requires_review", False)
        
        if overall_conf < 0.60 or requires_review:
            final_status = "REQUIRES_REVIEW"
        else:
            final_status = "PROCESSED"

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
        
        # 9. Update final document status
        doc.document_status = final_status
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
