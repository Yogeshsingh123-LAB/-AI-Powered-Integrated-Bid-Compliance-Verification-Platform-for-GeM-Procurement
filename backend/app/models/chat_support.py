"""Support records are separate from procurement decisions and documents."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, UUID
from app.db.database import Base


def now():
    return datetime.now(timezone.utc)


class SupportTicket(Base):
    __tablename__ = "support_tickets"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    application_id = Column(UUID(as_uuid=True), ForeignKey("bids.id"), nullable=True)
    subject = Column(String(160), nullable=False)
    status = Column(String(30), nullable=False, default="open")
    escalated_at = Column(DateTime(timezone=True), nullable=True)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=now)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=now)


class SupportMessage(Base):
    __tablename__ = "support_messages"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("support_tickets.id"), nullable=False, index=True)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    sender_kind = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=now)


class SupportPresence(Base):
    __tablename__ = "support_presence"
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    seen_at = Column(DateTime(timezone=True), nullable=False)


class ChatRateLimit(Base):
    __tablename__ = "chat_rate_limits"
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    scope = Column(String(20), primary_key=True)
    window = Column(Integer, nullable=False)
    count = Column(Integer, nullable=False)
