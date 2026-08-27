import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, UUID, Text, JSON
from sqlalchemy.orm import relationship
from app.db.database import Base

class DocumentExtraction(Base):
    __tablename__ = "document_extractions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column(String(50), nullable=False)
    extracted_data = Column(JSON, nullable=True)  # JSONB in Postgres, text JSON in SQLite
    raw_text = Column(Text, nullable=True)
    confidence_score = Column(Float, nullable=True)
    processing_status = Column(String(50), nullable=False, default="PROCESSED")
    model_name = Column(String(100), nullable=True)
    processed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    document = relationship("Document", back_populates="extractions")
