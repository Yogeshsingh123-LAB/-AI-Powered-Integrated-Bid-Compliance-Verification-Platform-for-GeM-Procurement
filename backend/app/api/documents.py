import os
import re
import uuid
import hashlib
import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, File, Form, UploadFile, Request, status
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

router = APIRouter(prefix="/documents", tags=["Document Storage & Verification"])

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
ALLOWED_MIMES = {"application/pdf", "image/jpeg", "image/png"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

def get_safe_filename(filename: str) -> str:
    """Sanitize the original filename to prevent path traversal and shell injection."""
    basename = os.path.basename(filename)
    safe_name = re.sub(r'[^a-zA-Z0-9._-]', '_', basename)
    return safe_name

def validate_file(file: UploadFile) -> bytes:
    """Validate file extension, MIME type, and size. Returns file bytes."""
    # Validate extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported file extension. Only PDF, JPG, JPEG, and PNG are allowed."
        )

    # Validate MIME type
    if file.content_type not in ALLOWED_MIMES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported MIME type. Only PDF, JPG, JPEG, and PNG are allowed."
        )

    # Validate size safely
    try:
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not read file size."
        )

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds the maximum limit of 10 MB."
        )

    # Read bytes
    file_bytes = file.file.read()
    return file_bytes

@router.post("/upload", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def upload_document(
    request: Request,
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
        # If DB save fails after successful upload, log and raise error
        logger.error(f"Database insertion failed after Supabase upload: {e}")
        # Note: In production we could clean up the uploaded storage file
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

    return {
        "success": True,
        "message": "Document uploaded successfully",
        "document": {
            "id": str(new_doc.id),
            "document_type": new_doc.document_type,
            "status": new_doc.document_status
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

    return {
        "success": True,
        "message": "Document replaced successfully",
        "document": {
            "id": str(new_doc.id),
            "document_type": new_doc.document_type,
            "status": new_doc.document_status
        }
    }
