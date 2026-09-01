import uuid
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.notification import Notification

logger = logging.getLogger(__name__)

def create_notification(
    db: Session,
    user_id: uuid.UUID,
    type: str,
    title: str,
    message: str,
    tender_id: Optional[uuid.UUID] = None,
    bid_id: Optional[uuid.UUID] = None,
    document_id: Optional[uuid.UUID] = None
) -> Notification:
    """Create a persistent notification record in the database."""
    try:
        notification = Notification(
            id=uuid.uuid4(),
            user_id=user_id,
            tender_id=tender_id,
            bid_id=bid_id,
            document_id=document_id,
            type=type,
            title=title,
            message=message,
            status="UNREAD",
            created_at=datetime.now(timezone.utc)
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        logger.info(f"Notification created for user {user_id}: [{type}] {title}")
        return notification
    except Exception as e:
        logger.error(f"Failed to create notification: {e}")
        db.rollback()
        raise

def get_user_notifications(db: Session, user_id: uuid.UUID, limit: int = 50) -> List[Notification]:
    """Retrieve persistent notifications for a given user ordered by latest first."""
    return db.query(Notification).filter(
        Notification.user_id == user_id
    ).order_by(Notification.created_at.desc()).limit(limit).all()

def mark_notification_read(db: Session, notification_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Notification]:
    """Mark a notification as read."""
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id
    ).first()
    if notif:
        notif.status = "READ"
        notif.read_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(notif)
    return notif
