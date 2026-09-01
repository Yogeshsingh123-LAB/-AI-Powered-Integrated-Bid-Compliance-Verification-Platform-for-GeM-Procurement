import uuid
from datetime import datetime, timezone
# pyrefly: ignore [missing-import]
from sqlalchemy import Column, String, Text, Numeric, JSON, DateTime, ForeignKey, UUID
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import relationship
from app.db.database import Base

class Tender(Base):
    __tablename__ = "tenders"

    id = Column(String(50), primary_key=True)  # e.g. "GEM/2026/001"
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    department = Column(String(255), nullable=True)
    tender_type = Column(String(100), nullable=True, default="Custom Bid")
    budget_limit = Column(Numeric(15, 2), nullable=False)
    status = Column(String(50), nullable=False, default="Draft")  # "Draft", "Active", "Closed", "Cancelled"
    eligibility_requirements = Column(Text, nullable=True)
    custom_rules = Column(JSON, nullable=True)  # Per-tender custom rule definitions
    scoring_weights = Column(JSON, nullable=True)  # Per-tender breakdown weights
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=True)
    published_at = Column(DateTime, nullable=True)
    closing_date = Column(DateTime, nullable=True)

    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    requirements = relationship("Requirement", back_populates="tender", cascade="all, delete-orphan")
    bids = relationship("Bid", back_populates="tender", cascade="all, delete-orphan")


