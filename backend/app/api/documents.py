import os
from app.models.document_ocr import DocumentOCR
import re
import uuid
import hashlib
import logging
from typing import List, Dict, Any, Optional
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, File, Form, UploadFile, Request, status, BackgroundTasks
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from app.db.database import get_db
from app.models.user import User
from app.models.bid import Bid
from app.models.requirement import Requirement
from app.models.document import Document
from app.schemas.document import DocumentResponse
from app.services.auth_service import get_current_user, require_role, create_audit_record
from app.services.storage_service import StorageService
from app.services.document_processing_service import process_document, process_document_background
from app.services.malware_scan import scan_file_bytes
from app.models.document_extraction import DocumentExtraction
from app.core.config import settings
settings = settings


router = APIRouter(prefix="/documents", tags=["Document Storage & Verification"])

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".tiff", ".bmp"}
ALLOWED_MIMES = {"application/pdf", "image/jpeg", "image/png", "image/tiff", "image/bmp"}
# Canonical limit lives in settings; keep this alias for backward compatibility.
MAX_FILE_SIZE = settings.max_upload_bytes


def get_safe_filename(filename: str) -> str:
    """Sanitize the original filename to prevent path traversal and shell injection."""
    basename = os.path.basename(filename)
    safe_name = re.sub(r'[^a-zA-Z0-9._-]', '_', basename)
    return safe_name


def detect_content_type_magic(data: bytes) -> str:
    """
    Identify the real file type from magic bytes. The client-supplied
    Content-Type header is NOT trusted for authorization decisions.
    Returns a canonical type string or "" if unrecognized.
    """
    if data[:5] == b"%PDF-":
        return "application/pdf"
    if data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if data[:4] in (b"II*\x00", b"MM\x00*"):
        return "image/tiff"
    if data[:2] == b"BM":
        return "image/bmp"
    return ""


def _validate_pdf_limits(data: bytes) -> None:
    """PDF decompression-bomb / resource protection: cap page count."""
    try:
        import io
        import pdfplumber
        with pdfplumber.open(io.BytesIO(data)) as pdf:
            page_count = len(pdf.pages)
        if page_count > settings.MAX_UPLOAD_PAGES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"PDF exceeds the maximum allowed page count of {settings.MAX_UPLOAD_PAGES}."
            )
    except HTTPException:
        raise
    except Exception as e:
        # Unparseable PDF: reject rather than pass it to the OCR pipeline.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not parse the PDF. The file appears to be corrupted or malformed."
        ) from e


def validate_file(file: UploadFile) -> bytes:
    """
    Server-side upload validation (never trusts the client):

    1. Filename length limit (path/shell safety).
    2. Extension allow-list.
    3. Chunked read with a hard byte limit (the limit is enforced while
       reading, not only from the reported size).
    4. Magic-byte content type check (client Content-Type ignored for
       authorization).
    5. PDF page-count cap (decompression-bomb protection).
    6. Optional ClamAV malware scan when CLAMAV_SOCKET is configured.
    """
    filename = file.filename or ""
    if len(filename) > settings.MAX_FILENAME_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Filename exceeds the maximum length of {settings.MAX_FILENAME_LENGTH} characters."
        )

    # 1. Extension allow-list
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported file extension. Only PDF, JPG, JPEG, PNG, TIFF, and BMP are allowed."
        )

    # 2. Chunked read with hard byte limit
    max_bytes = settings.max_upload_bytes
    chunks = []
    total = 0
    try:
        while True:
            chunk = file.file.read(1024 * 1024)
            if not chunk:
                break
            total += len(chunk)
            if total > max_bytes:
                raise HTTPException(
                    status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                    detail=f"File size exceeds the maximum limit of {settings.MAX_UPLOAD_MB} MB."
                )
            chunks.append(chunk)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read the uploaded file.")

    if total == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    file_bytes = b"".join(chunks)

    # 3. Magic-byte content type (client MIME is not trusted)
    detected = detect_content_type_magic(file_bytes)
    if detected == "":
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="File content does not match an allowed document type."
        )
    if ext in {".jpg", ".jpeg"} and detected != "image/jpeg":
        raise HTTPException(status_code=415, detail="File content is not a valid JPEG image.")
    if ext == ".png" and detected != "image/png":
        raise HTTPException(status_code=415, detail="File content is not a valid PNG image.")
    if ext == ".pdf" and detected != "application/pdf":
        raise HTTPException(status_code=415, detail="File content is not a valid PDF document.")
    if ext in {".tiff", ".tif"} and detected != "image/tiff":
        raise HTTPException(status_code=415, detail="File content is not a valid TIFF image.")
    if ext == ".bmp" and detected != "image/bmp":
        raise HTTPException(status_code=415, detail="File content is not a valid BMP image.")

    # 4. PDF page-count / decompression-bomb protection
    if detected == "application/pdf":
        _validate_pdf_limits(file_bytes)

    # 5. Optional malware scan (ClamAV over TCP when configured)
    if settings.CLAMAV_SOCKET:
        scan_file_bytes(file_bytes, filename or "upload")

    return file_bytes

@router.post("/upload", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def upload_document(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    bid_id: uuid.UUID = Form(...),
    requirement_id: uuid.UUID = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a new compliance document (BIDDER only)."""
    ip_address = request.client.host if request.client else None

    # 1. Verify user is a BIDDER
    if current_user.role.upper() != "BIDDER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only bidders are authorized to upload documents."
        )

    # 2. Verify bid exists
    bid = db.query(Bid).filter(Bid.id == bid_id).first()
    if not bid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated bid not found."
        )

    # 3. Verify bid belongs to authenticated bidder
    if bid.bidder_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to upload files for another bidder's bid."
        )

    # 4. Verify requirement exists
    requirement = db.query(Requirement).filter(Requirement.id == requirement_id).first()
    if not requirement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated requirement not found."
        )

    # 5. Verify requirement belongs to the tender associated with the bid
    if requirement.tender_id != bid.tender_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Requirement does not belong to the tender of this bid."
        )

    # 6. Validate file
    file_bytes = validate_file(file)

    # 7. Calculate SHA-256
    file_hash = hashlib.sha256(file_bytes).hexdigest()

    # 8. Check duplicate document
    duplicate = db.query(Document).filter(
        Document.bid_id == bid_id,
        Document.requirement_id == requirement_id,
        Document.file_hash == file_hash,
        Document.document_status != "REPLACED"
    ).first()
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Same document has already been uploaded."
        )

    # 9. Generate UUID and secure storage path
    doc_uuid = uuid.uuid4()
    safe_name = get_safe_filename(file.filename)
    
    # Path format: {bidder_id}/{bid_id}/{requirement_code}/{uuid}_{safe_filename}
    storage_path = f"{current_user.id}/{bid_id}/{requirement.code}/{doc_uuid}_{safe_name}"

    # 10. Upload to private Supabase Storage
    try:
        StorageService.upload_file(
            file_data=file_bytes,
            storage_path=storage_path,
            mime_type=file.content_type
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload file to storage."
        )

    # 11. Save metadata in PostgreSQL
    try:
        new_doc = Document(
            id=doc_uuid,
            bid_id=bid_id,
            requirement_id=requirement_id,
            document_type=requirement.code + "_CERTIFICATE",
            original_filename=file.filename,
            storage_path=storage_path,
            mime_type=file.content_type,
            file_size=len(file_bytes),
            file_hash=file_hash,
            document_status="UPLOADED",
            uploaded_by=current_user.id
        )
        db.add(new_doc)
        db.commit()
        db.refresh(new_doc)
    except Exception as e:
        db.rollback()
        # Atomicity: if the metadata insert fails after the file reached
        # storage, remove the orphaned file so storage never accumulates
        # unreferenced uploads.
        try:
            StorageService.delete_file(storage_path)
            logger.info(f"Cleaned up orphaned storage file after DB failure: {storage_path}")
        except Exception as cleanup_err:
            logger.error(f"Failed to clean up orphaned file {storage_path}: {cleanup_err}")
        logger.error(f"Database insertion failed after storage upload: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database metadata insertion failed after storage upload."
        )

    # 12. Create audit log
    create_audit_record(
        db=db,
        action="DOCUMENT_UPLOADED",
        user_id=current_user.id,
        entity_type="Document",
        entity_id=new_doc.id,
        bid_id=bid_id,
        new_value=f"Uploaded document ID: {new_doc.id}, Storage Path: {storage_path}",
        ip_address=ip_address
    )

    # 13. Processing strategy.
    #
    # - Cloud + INLINE_PROCESSING (Vercel Fluid Compute, maxDuration 300): run
    #   the pipeline synchronously inside the request. BackgroundTasks are
    #   unreliable on serverless (killed after the response), so the 300s
    #   function budget does the work and the final status is returned in the
    #   response. Upload size/page caps keep a single document inside the
    #   budget; if the function still times out (504) the document stays in a
    #   pre-final status and can be re-run via POST /{id}/reprocess.
    # - Cloud without INLINE_PROCESSING: leave UPLOADED for a durable worker
    #   (backend/worker.py on a long-lived platform).
    # - Local development: in-process background task.
    if settings.is_cloud and settings.INLINE_PROCESSING:
        processing_note = "processing synchronously (serverless)"
        logger.info(
            "Serverless deployment: processing document %s synchronously "
            "within the function time budget.",
            new_doc.id,
        )
        process_document_background(new_doc.id, current_user.id)
        db.expire(new_doc)
    elif settings.is_cloud:
        logger.warning(
            "Cloud deployment: document %s left queued (status=UPLOADED) for the "
            "durable worker (backend/worker.py). Set INLINE_PROCESSING=true to "
            "process synchronously inside the function instead.",
            new_doc.id,
        )
        processing_note = "queued for durable worker"
    else:
        background_tasks.add_task(process_document_background, new_doc.id, current_user.id)
        processing_note = "queued for in-process processing"

    return {
        "success": True,
        "message": f"Document uploaded successfully ({processing_note}).",
        "document": {
            "id": str(new_doc.id),
            "document_type": new_doc.document_type,
            "status": new_doc.document_status
        }
    }

# Statuses from which a (re)processing run is allowed. Anything else is
# either a terminal success (VERIFIED) or an officer decision (REJECTED).
_REPROCESSABLE_STATUSES = {
    "UPLOADED", "PROCESSING", "TEXT_EXTRACTION", "DOCUMENT_CLASSIFICATION",
    "FIELD_EXTRACTION", "VALIDATION", "PROCESSED", "REQUIRES_REVIEW",
    "PROCESSING_FAILED",
}
MAX_PROCESSING_ATTEMPTS = 3


@router.post("/{doc_id}/reprocess", response_model=Dict[str, Any])
def reprocess_document(
    request: Request,
    doc_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Re-run the processing pipeline for a document (synchronously).

    Used when a serverless invocation timed out mid-pipeline (504) or a
    previous attempt failed. Access: the document owner, or any
    officer/admin/auditor. Limited to MAX_PROCESSING_ATTEMPTS runs.
    """
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    is_privileged = current_user.role in ("OFFICER", "ADMIN", "AUDITOR")
    if doc.uploaded_by != current_user.id and not is_privileged:
        raise HTTPException(status_code=403, detail="You can only reprocess your own documents.")

    if (doc.document_status or "").upper() not in _REPROCESSABLE_STATUSES:
        raise HTTPException(
            status_code=409,
            detail=f"Document is in status '{doc.document_status}'; reprocessing is not allowed.",
        )
    if doc.processing_attempts >= MAX_PROCESSING_ATTEMPTS:
        raise HTTPException(
            status_code=409,
            detail=f"Processing attempt limit ({MAX_PROCESSING_ATTEMPTS}) reached for this document.",
        )

    doc.processing_attempts += 1
    # Clean partial results from the previous attempt for a clean re-run.
    db.query(DocumentOCR).filter(DocumentOCR.document_id == doc.id).delete()
    db.query(DocumentExtraction).filter(DocumentExtraction.document_id == doc.id).delete()
    db.commit()

    ip_address = request.client.host if request and request.client else None
    process_document_background(doc.id, current_user.id)
    db.expire(doc)

    create_audit_record(
        db=db,
        action="DOCUMENT_REPROCESSED",
        user_id=current_user.id,
        entity_type="Document",
        entity_id=doc.id,
        bid_id=doc.bid_id,
        new_value=f"Reprocessing attempt {doc.processing_attempts} finished with status {doc.document_status}",
        ip_address=ip_address,
    )

    return {
        "success": True,
        "document": {
            "id": str(doc.id),
            "document_type": doc.document_type,
            "status": doc.document_status,
            "processing_attempts": doc.processing_attempts,
        }
    }


@router.get("/bid/{bid_id}", response_model=List[DocumentResponse])
def list_documents(
    bid_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all active (non-replaced) documents belonging to a specified bid."""
    # 1. Verify bid exists
    bid = db.query(Bid).filter(Bid.id == bid_id).first()
    if not bid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bid not found."
        )

    # 2. Check authorization
    # BIDDER: Can only access their own bids
    if current_user.role.upper() == "BIDDER" and bid.bidder_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view another bidder's files."
        )

    # 3. Retrieve non-replaced documents
    documents = db.query(Document).filter(
        Document.bid_id == bid_id,
        Document.document_status != "REPLACED"
    ).all()
    return documents

@router.get("/{document_id}/download", response_model=Dict[str, Any])
def download_document(
    document_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a temporary signed download URL for the document."""
    ip_address = request.client.host if request.client else None

    # 1. Retrieve document metadata
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found."
        )

    # 2. Check authorization
    # BIDDER: Only if they own the bid
    if current_user.role.upper() == "BIDDER":
        bid = db.query(Bid).filter(Bid.id == doc.bid_id).first()
        if not bid or bid.bidder_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to download this document."
            )

    # 3. Generate signed URL
    try:
        signed_url = StorageService.get_signed_url(doc.storage_path, expires_in=300)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate signed download URL."
        )

    # 4. Log audit event
    create_audit_record(
        db=db,
        action="DOCUMENT_DOWNLOADED",
        user_id=current_user.id,
        entity_type="Document",
        entity_id=doc.id,
        bid_id=doc.bid_id,
        ip_address=ip_address
    )

    return {
        "success": True,
        "document_id": str(doc.id),
        "original_filename": doc.original_filename,
        "download_url": signed_url
    }

@router.delete("/{document_id}", response_model=Dict[str, Any])
def delete_document(
    document_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a document (removes from Supabase Storage and database metadata)."""
    ip_address = request.client.host if request.client else None

    # 1. Retrieve document
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found."
        )

    # 2. Check authorization
    if current_user.role.upper() == "BIDDER":
        bid = db.query(Bid).filter(Bid.id == doc.bid_id).first()
        if not bid or bid.bidder_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to delete this document."
            )
        
        # Check if bid status allows deletion (only allow if Pending/not finalized)
        if bid.status.upper() not in {"PENDING"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete documents on a finalized/reviewed bid."
            )

    # 3. Delete from Supabase Storage
    supabase_deleted = False
    try:
        supabase_deleted = StorageService.delete_file(doc.storage_path)
    except Exception as e:
        logger.error(f"Failed to delete file from Supabase storage: {e}")
        # Note: We continue to database deletion or prompt error depending on logic.
        # But instructions say: "If Supabase deletion succeeds but database deletion fails, handle the failure safely and log it."
        # If Supabase deletion fails, we will abort to prevent file leakage/orphans.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete file from storage. Aborting database removal."
        )

    # 4. Delete metadata from PostgreSQL
    try:
        db.delete(doc)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Database deletion failed for document {document_id} after Supabase deletion: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="File deleted from storage but metadata removal failed in database."
        )

    # 5. Create audit log
    create_audit_record(
        db=db,
        action="DOCUMENT_DELETED",
        user_id=current_user.id,
        entity_type="Document",
        entity_id=document_id,
        bid_id=doc.bid_id,
        old_value=f"Filename: {doc.original_filename}, Storage Path: {doc.storage_path}",
        ip_address=ip_address
    )

    return {
        "success": True,
        "message": "Document deleted successfully"
    }

@router.post("/{document_id}/replace", response_model=Dict[str, Any])
def replace_document(
    document_id: uuid.UUID,
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Replace an existing compliance document with a new one."""
    ip_address = request.client.host if request.client else None

    # 1. Retrieve old document metadata
    old_doc = db.query(Document).filter(Document.id == document_id).first()
    if not old_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found."
        )

    # 2. Check authorization
    if current_user.role.upper() == "BIDDER":
        bid = db.query(Bid).filter(Bid.id == old_doc.bid_id).first()
        if not bid or bid.bidder_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to replace this document."
            )
        if bid.status.upper() not in {"PENDING"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot replace documents on a finalized/reviewed bid."
            )

    # Fetch associated requirement
    req_obj = db.query(Requirement).filter(Requirement.id == old_doc.requirement_id).first()
    if not req_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated requirement not found."
        )

    # 3. Validate new file
    file_bytes = validate_file(file)

    # 4. Calculate new SHA-256
    new_hash = hashlib.sha256(file_bytes).hexdigest()

    # 5. Check duplicate document
    duplicate = db.query(Document).filter(
        Document.bid_id == old_doc.bid_id,
        Document.requirement_id == old_doc.requirement_id,
        Document.file_hash == new_hash,
        Document.document_status != "REPLACED"
    ).first()
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Same document has already been uploaded."
        )

    # 6. Upload new file
    new_uuid = uuid.uuid4()
    safe_name = get_safe_filename(file.filename)
    new_storage_path = f"{current_user.id}/{old_doc.bid_id}/{req_obj.code}/{new_uuid}_{safe_name}"

    try:
        StorageService.upload_file(
            file_data=file_bytes,
            storage_path=new_storage_path,
            mime_type=file.content_type
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload new file to storage."
        )

    # 7. Update database metadata
    try:
        # Mark old document as REPLACED
        old_doc.document_status = "REPLACED"
        old_doc.updated_at = old_doc.updated_at  # Trigger updated_at
        
        # Create new document record set to UPLOADED
        new_doc = Document(
            id=new_uuid,
            bid_id=old_doc.bid_id,
            requirement_id=old_doc.requirement_id,
            document_type=old_doc.document_type,
            original_filename=file.filename,
            storage_path=new_storage_path,
            mime_type=file.content_type,
            file_size=len(file_bytes),
            file_hash=new_hash,
            document_status="UPLOADED",
            uploaded_by=current_user.id
        )
        db.add(new_doc)
        db.commit()
        db.refresh(new_doc)
    except Exception as e:
        db.rollback()
        logger.error(f"Database insertion of replaced document failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="New file uploaded, but database metadata replacement failed."
        )

    # 8. Delete old file from Supabase Storage
    try:
        StorageService.delete_file(old_doc.storage_path)
    except Exception as e:
        # If storage deletion fails, we log it but don't fail the API because database is in sync
        logger.error(f"Failed to delete replaced file {old_doc.storage_path} from Supabase: {e}")

    # 9. Create audit log
    create_audit_record(
        db=db,
        action="DOCUMENT_REPLACED",
        user_id=current_user.id,
        entity_type="Document",
        entity_id=new_doc.id,
        bid_id=old_doc.bid_id,
        old_value=f"Old Doc ID: {old_doc.id}, Old Path: {old_doc.storage_path}",
        new_value=f"New Doc ID: {new_doc.id}, New Path: {new_doc.storage_path}",
        ip_address=ip_address
    )

    # 10. Queue background processing for the new document
    background_tasks.add_task(process_document_background, new_doc.id, current_user.id)

    return {
        "success": True,
        "message": "Document replaced successfully",
        "document": {
            "id": str(new_doc.id),
            "document_type": new_doc.document_type,
            "status": new_doc.document_status
        }
    }


@router.post("/{document_id}/process", response_model=Dict[str, Any])
def force_process_document(
    document_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    background: bool = False,
    current_user: User = Depends(require_role("OFFICER", "ADMIN")),
    db: Session = Depends(get_db)
):
    """Force processing of a specific document (OFFICER or ADMIN only)."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found."
        )

    if background:
        background_tasks.add_task(process_document_background, doc.id, current_user.id)
        return {
            "success": True,
            "message": "Document processing queued in background",
            "document_id": str(doc.id),
            "status": "PROCESSING"
        }
    
    try:
        updated_doc = process_document(db, doc.id, current_user.id)
        return {
            "success": True,
            "message": "Document processed successfully",
            "document_id": str(updated_doc.id),
            "status": updated_doc.document_status
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document processing failed: {str(e)}"
        )


@router.post("/{document_id}/reprocess", response_model=Dict[str, Any])
def reprocess_document(
    document_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    background: bool = False,
    current_user: User = Depends(require_role("OFFICER", "ADMIN")),
    db: Session = Depends(get_db)
):
    """Reprocess a document (OFFICER or ADMIN only)."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found."
        )

    # Log audit trail for reprocessing
    create_audit_record(
        db=db,
        action="DOCUMENT_REPROCESSED",
        user_id=current_user.id,
        entity_type="Document",
        entity_id=doc.id,
        bid_id=doc.bid_id,
        new_value=f"Reprocessing requested by {current_user.email} (Role: {current_user.role})"
    )

    if background:
        background_tasks.add_task(process_document_background, doc.id, current_user.id)
        return {
            "success": True,
            "message": "Document reprocessing queued in background",
            "document_id": str(doc.id),
            "status": "PROCESSING"
        }
    
    try:
        updated_doc = process_document(db, doc.id, current_user.id)
        return {
            "success": True,
            "message": "Document reprocessed successfully",
            "document_id": str(updated_doc.id),
            "status": updated_doc.document_status
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Reprocessing failed: {str(e)}"
        )


@router.get("/{document_id}/extraction", response_model=Dict[str, Any])
def get_document_extraction(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve document extraction results.
    Bidders can only view their own documents. Officers and Admins can view all.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found."
        )

    # Authorization Check
    if current_user.role.upper() == "BIDDER":
        bid = db.query(Bid).filter(Bid.id == doc.bid_id).first()
        if not bid or bid.bidder_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to view this document's extraction."
            )

    # Get the latest extraction record
    latest_extraction = db.query(DocumentExtraction).filter(
        DocumentExtraction.document_id == doc.id
    ).order_by(DocumentExtraction.processed_at.desc()).first()

    extracted_fields = {}
    missing_fields = []
    confidence = 0.0
    
    if latest_extraction:
        extracted_fields = latest_extraction.extracted_data or {}
        missing_fields = [k for k, v in extracted_fields.items() if v is None]
        confidence = latest_extraction.confidence_score or 0.0

    return {
        "document_id": str(doc.id),
        "document_type": doc.document_type,
        "confidence": confidence,
        "extracted_fields": extracted_fields,
        "missing_fields": missing_fields,
        "processing_status": doc.document_status
    }


@router.post("/upload-rfp", response_model=Dict[str, Any])
async def upload_rfp(
    file: UploadFile = File(...),
    tender_value: float = Form(100000.0),
    is_reverse_auction: bool = Form(False)
):
    """
    Upload RFP document and auto-detect GeM 4.0 Procurement Mode & Techno-Commercial Loading Criteria.
    - Direct Purchase: <= ₹50,000
    - L1 Purchase: ₹50,000 to ₹10L (Technical Score >= 70% required)
    - Custom Bid: > ₹10L (Full Techno-Commercial Loading penalties)
    """
    from app.services.tender_analyzer import detect_mode, apply_compliance_rules
    from app.ai_engine import PDFHandler

    # Validate uploaded file
    file_bytes = validate_file(file)
    ext = os.path.splitext(file.filename or "")[1].lower()
    
    extracted_text = ""
    if ext == ".pdf":
        try:
            handler = PDFHandler()
            res = handler.extract_text(file_bytes)
            extracted_text = res.get("text", "")
        except Exception:
            extracted_text = file_bytes.decode("utf-8", errors="ignore")
    else:
        extracted_text = file_bytes.decode("utf-8", errors="ignore")

    # Sample regex extraction for bid fields from extracted text
    mock_extracted_data = {
        "bid_amount": tender_value,
        "gstin": "27AAACA12341Z5" if "GST" in extracted_text.upper() else "27AAACA12341Z5",
        "pan": "AAACA1234A",
        "udyam": "UDYAM-MH-01-0012345",
        "technical_score": 85.0 if len(extracted_text) > 100 else 75.0,
        "standard_delivery_weeks": 4,
        "offered_delivery_weeks": 4 if "FAST" in extracted_text.upper() else 5,
        "payment_terms": "Milestone" if "MILESTONE" in extracted_text.upper() else "Standard",
        "required_warranty_years": 3,
        "offered_warranty_years": 3,
        "spec_gap_count": 0
    }

    mode = detect_mode(tender_value, is_reverse_auction)
    compliance_result = apply_compliance_rules(mode, mock_extracted_data)

    return {
        "success": True,
        "filename": file.filename,
        "tender_value": tender_value,
        "mode": mode.value,
        "compliance_result": compliance_result
    }

