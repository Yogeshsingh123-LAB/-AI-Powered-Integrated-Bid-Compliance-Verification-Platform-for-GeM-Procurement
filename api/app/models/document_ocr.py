import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, UUID, Text
from sqlalchemy.orm import relationship
from app.db.database import Base

class DocumentOCR(Base):
    __tablename__ = "document_ocr"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    ocr_text = Column(Text, nullable=False)
    ocr_engine = Column(String(50), nullable=False, default="tesseract")
    ocr_confidence = Column(Float, nullable=True)
    page_count = Column(Integer, nullable=True)
    processed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    document = relationship("Document", back_populates="ocr_records")
