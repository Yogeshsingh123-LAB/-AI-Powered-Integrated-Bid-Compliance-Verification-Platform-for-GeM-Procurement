"""Fixed lookups only. No SQL, table names or permissions are supplied by the AI."""
import logging
import time
from uuid import UUID

from fastapi import Depends, HTTPException
from sqlalchemy import update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.bid import Bid
from app.models.chat_support import ChatRateLimit
from app.models.user import User
from app.services.auth_service import get_current_user

logger = logging.getLogger(__name__)


def limit_requests(scope="chat", maximum=30):
    def check(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        # Shared database counters work across server workers; one row per user/scope.
        window = int(time.time() // 60)
        key = (ChatRateLimit.user_id == user.id, ChatRateLimit.scope == scope)
        db.execute(update(ChatRateLimit).where(*key, ChatRateLimit.window != window)
                   .values(window=window, count=0))
        result = db.execute(update(ChatRateLimit).where(*key, ChatRateLimit.count < maximum)
                            .values(count=ChatRateLimit.count + 1))
        if result.rowcount:
            db.commit()
            return
        if db.query(ChatRateLimit).filter(*key).first():
            db.rollback()
            logger.warning("Chat request limit reached: scope=%s user=%s", scope, user.id)
            raise HTTPException(429, "Too many requests. Please try again in a minute.",
                                headers={"Retry-After": "60"})
        db.add(ChatRateLimit(user_id=user.id, scope=scope, window=window, count=1))
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            # A concurrent first request created the counter. Count this request too.
            result = db.execute(update(ChatRateLimit).where(*key, ChatRateLimit.count < maximum)
                                .values(count=ChatRateLimit.count + 1))
            db.commit()
            if not result.rowcount:
                raise HTTPException(429, "Too many requests. Please try again in a minute.",
                                    headers={"Retry-After": "60"})
    return check


def owned_application(db: Session, reference: UUID, user: User):
    # Fetch only public-facing status fields, never documents, scores or officer notes.
    bid = db.query(Bid.id, Bid.status, Bid.officer_status, Bid.submitted_at, Bid.reviewed_at).filter(
        Bid.id == reference, Bid.bidder_id == user.id,
    ).first()
    if not bid:
        logger.info("Application tracking miss for user=%s", user.id)
        # Identical response for missing and someone else's application.
        raise HTTPException(404, "Application unavailable. Check the full reference and signed-in account.")
    return bid
