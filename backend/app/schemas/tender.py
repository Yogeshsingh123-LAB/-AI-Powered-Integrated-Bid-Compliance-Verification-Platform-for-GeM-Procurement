from typing import Optional, List, Any, Dict
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class TenderBase(BaseModel):
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    category: Optional[str] = "General Hardware & Services"
    department: Optional[str] = "Chennai Petroleum Corporation Limited (CPCL)"
    tender_type: Optional[str] = "Custom Bid"
    budget_limit: float = Field(..., gt=0)
    eligibility_requirements: Optional[str] = None
    status: Optional[str] = "Draft"  # "Draft", "Active", "Closed", "Cancelled"
    closing_date: Optional[str] = None

class TenderCreate(TenderBase):
    id: Optional[str] = None  # e.g., "GEM/2026/001", generated if auto-assigned

class TenderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    department: Optional[str] = None
    tender_type: Optional[str] = None
    budget_limit: Optional[float] = None
    eligibility_requirements: Optional[str] = None
    status: Optional[str] = None
    closing_date: Optional[str] = None

class TenderResponse(TenderBase):
    id: str
    status: str
    created_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    closing_date: Optional[datetime] = None
    bids_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)
