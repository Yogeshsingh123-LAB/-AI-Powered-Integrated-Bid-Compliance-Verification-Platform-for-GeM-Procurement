"""
Bidder Model for GeM Procurement
Supports domestic (Indian) and international (Global Tender Enquiry - GTE) bidders.
"""
from typing import Optional
from pydantic import BaseModel, Field


class Bidder(BaseModel):
    company_name: str
    pan: Optional[str] = Field(default=None, description="Indian PAN (10 characters)")
    gst: Optional[str] = Field(default=None, description="Indian GSTIN (15 characters)")
    foreign_tax_id: Optional[str] = Field(default=None, description="Foreign Tax ID (e.g., EIN, VAT registration)")
    import_license: Optional[str] = Field(default=None, description="Import/Export license or IEC certificate number")
    country: str = Field(default="India", description="Country of registration")
