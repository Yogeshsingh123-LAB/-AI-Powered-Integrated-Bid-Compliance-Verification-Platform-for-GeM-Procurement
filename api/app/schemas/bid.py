from typing import Optional, List, Any, Dict
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict

class BidCreate(BaseModel):
    tender_id: str

class BidResponse(BaseModel):
    id: UUID
    tender_id: str
    bidder_id: UUID
    compliance_score: Optional[float] = None
    status: str
    is_locked: bool = False
    submitted_at: datetime
    
    # Officer decision metadata
    officer_status: Optional[str] = "Pending"
    deviation_justification: Optional[str] = None
    deviation_category: Optional[str] = None
    reviewed_at: Optional[datetime] = None

    # Enriched payload for frontend
    bidder_name: Optional[str] = None
    bidder_email: Optional[str] = None
    tender_title: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
