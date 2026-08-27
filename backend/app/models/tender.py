from sqlalchemy import Column, String, Text, Numeric
from sqlalchemy.orm import relationship
from app.db.database import Base

class Tender(Base):
    __tablename__ = "tenders"

    id = Column(String(50), primary_key=True)  # e.g. "GEM/2026/001"
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    budget_limit = Column(Numeric(15, 2), nullable=False)
    status = Column(String(50), nullable=False, default="Active")  # "Active", "Closed"

    # Relationships
    requirements = relationship("Requirement", back_populates="tender", cascade="all, delete-orphan")
    bids = relationship("Bid", back_populates="tender", cascade="all, delete-orphan")
