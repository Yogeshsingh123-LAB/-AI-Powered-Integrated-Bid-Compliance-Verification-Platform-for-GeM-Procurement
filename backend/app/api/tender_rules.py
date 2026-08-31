# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field

from app.db.database import get_db
from app.models.tender import Tender
from app.models.user import User
from app.services.auth_service import get_current_active_user

router = APIRouter(prefix="/v1/tenders", tags=["Tender Configuration Engine"])

class RuleDefinition(BaseModel):
    rule_id: str = Field(..., example="CR-01")
    name: str = Field(..., example="Minimum Annual Turnover")
    field: str = Field(..., example="turnover")  # turnover, experience_years, local_content_pct, oem_authorization
    operator: str = Field(default=">=", example=">=")  # >=, <=, ==, contains
    value: Any = Field(default=50, example=50)
    weight: int = Field(default=20, example=20)
    is_mandatory: bool = Field(default=True)

class ScoringWeights(BaseModel):
    completeness: int = Field(default=25, example=25)
    verification: int = Field(default=35, example=35)
    integrity: int = Field(default=20, example=20)
    custom_rules: int = Field(default=20, example=20)

class TenderConfigRequest(BaseModel):
    custom_rules: List[RuleDefinition]
    scoring_weights: ScoringWeights

@router.get("/{tender_id}/config", response_model=Dict[str, Any])
def get_tender_config(tender_id: str, db: Session = Depends(get_db)):
    """Fetch tender custom rules and buyer scoring weights configuration."""
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tender '{tender_id}' not found."
        )

    return {
        "tender_id": tender.id,
        "title": tender.title,
        "custom_rules": tender.custom_rules or [],
        "scoring_weights": tender.scoring_weights or {
            "completeness": 25,
            "verification": 35,
            "integrity": 20,
            "custom_rules": 20
        }
    }

@router.post("/{tender_id}/config", response_model=Dict[str, Any])
def update_tender_config(
    tender_id: str,
    payload: TenderConfigRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Save or update custom compliance rules and scoring weights for a tender."""
    if current_user.role not in {"ADMIN", "OFFICER"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Procurement Officers and Admins can configure tender compliance rules."
        )

    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tender '{tender_id}' not found."
        )

    tender.custom_rules = [r.dict() for r in payload.custom_rules]
    tender.scoring_weights = payload.scoring_weights.dict()
    db.commit()
    db.refresh(tender)

    return {
        "success": True,
        "message": f"Tender configuration updated successfully for '{tender_id}'.",
        "custom_rules": tender.custom_rules,
        "scoring_weights": tender.scoring_weights
    }
