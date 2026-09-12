import uuid
from sqlalchemy import Column, String, ForeignKey, Boolean, UUID
from sqlalchemy.orm import relationship
from app.db.database import Base

class Requirement(Base):
    __tablename__ = "requirements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tender_id = Column(String(50), ForeignKey("tenders.id", ondelete="CASCADE"), nullable=False, index=True)
    code = Column(String(50), nullable=False)  # e.g., "GST", "PAN", "MSME"
    description = Column(String(255), nullable=True)
    is_mandatory = Column(Boolean, default=True, nullable=False)

    # Relationships
    tender = relationship("Tender", back_populates="requirements")
    documents = relationship("Document", back_populates="requirement", cascade="all, delete-orphan")
