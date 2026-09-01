import uuid
import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.services.auth_service import get_current_user
from app.services.notification_service import get_user_notifications, mark_notification_read

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[Dict[str, Any]])
def list_user_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve persistent notifications for the currently logged-in user."""
    notifications = get_user_notifications(db, current_user.id)
    return [
        {
            "id": str(n.id),
            "user_id": str(n.user_id),
            "tender_id": str(n.tender_id) if n.tender_id else None,
            "bid_id": str(n.bid_id) if n.bid_id else None,
            "document_id": str(n.document_id) if n.document_id else None,
            "type": n.type,
            "title": n.title,
            "message": n.message,
            "status": n.status,
            "created_at": n.created_at.isoformat() if n.created_at else None,
            "read_at": n.read_at.isoformat() if n.read_at else None
        }
        for n in notifications
    ]

@router.put("/{notification_id}/read", response_model=Dict[str, Any])
def mark_read_endpoint(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a notification as read."""
    notif = mark_notification_read(db, notification_id, current_user.id)
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found or access denied."
        )
    return {
        "success": True,
        "id": str(notif.id),
        "status": notif.status,
        "read_at": notif.read_at.isoformat() if notif.read_at else None
    }
