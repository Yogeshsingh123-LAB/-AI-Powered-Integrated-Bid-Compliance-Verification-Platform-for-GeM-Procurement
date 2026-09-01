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
    rule_id: str = Field(..., json_schema_extra={"example": "CR-01"})
    name: str = Field(..., json_schema_extra={"example": "Minimum Annual Turnover"})
    field: str = Field(..., json_schema_extra={"example": "turnover"})  # turnover, experience_years, local_content_pct, oem_authorization
    operator: str = Field(default=">=", json_schema_extra={"example": ">="})  # >=, <=, ==, contains
    value: Any = Field(default=50, json_schema_extra={"example": 50})
    weight: int = Field(default=20, json_schema_extra={"example": 20})
    is_mandatory: bool = Field(default=True)

class ScoringWeights(BaseModel):
    completeness: int = Field(default=25, json_schema_extra={"example": 25})
    verification: int = Field(default=35, json_schema_extra={"example": 35})
    integrity: int = Field(default=20, json_schema_extra={"example": 20})
    custom_rules: int = Field(default=20, json_schema_extra={"example": 20})

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


class CreateTenderPayload(BaseModel):
    id: str = Field(..., json_schema_extra={"example": "CPCL/2026/001"})
    title: str = Field(..., json_schema_extra={"example": "Industrial Equipment Supply"})
    description: Optional[str] = None
    category: Optional[str] = "Equipment"
    department: Optional[str] = "Procurement"
    budget_limit: Optional[float] = 5000000.0
    closing_date: Optional[str] = "2026-09-30"


@router.get("", response_model=List[Dict[str, Any]])
def list_all_tenders(db: Session = Depends(get_db)):
    """List all procurement tenders in the platform."""
    tenders = db.query(Tender).all()
    result = []
    for t in tenders:
        result.append({
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "budget_limit": float(t.budget_limit) if t.budget_limit else 0.0,
            "status": t.status,
            "custom_rules": t.custom_rules,
            "scoring_weights": t.scoring_weights
        })
    return result


@router.post("", response_model=Dict[str, Any])
def create_new_tender(
    payload: CreateTenderPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new procurement tender in the database."""
    if current_user.role not in {"ADMIN", "OFFICER"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Procurement Officers and Admins can create new tenders."
        )

    existing = db.query(Tender).filter(Tender.id == payload.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tender with ID '{payload.id}' already exists."
        )

    new_tender = Tender(
        id=payload.id,
        title=payload.title,
        description=payload.description,
        budget_limit=payload.budget_limit or 5000000.0,
        status="Active"
    )
    db.add(new_tender)
    db.commit()
    db.refresh(new_tender)

    return {
        "success": True,
        "message": f"Tender '{new_tender.id}' created successfully.",
        "tender": {
            "id": new_tender.id,
            "title": new_tender.title,
            "status": new_tender.status
        }
    }
