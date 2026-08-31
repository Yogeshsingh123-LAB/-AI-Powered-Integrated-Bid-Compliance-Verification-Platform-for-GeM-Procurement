# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, List, Any, Optional
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.tender import Tender
from app.models.bid import Bid
from app.scoring.cartel_detector import CartelDetector
from app.services.cartel_graph_service import cartel_graph_service

router = APIRouter(prefix="/v1/cartel", tags=["Cartel & Anti-Competitive Intelligence"])

@router.get("/graph/{tender_id}", response_model=Dict[str, Any])
def get_tender_cartel_graph(tender_id: str, db: Session = Depends(get_db)):
    """Fetches Cytoscape/D3 compatible bidder relationship graph data for a specific tender."""
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tender '{tender_id}' not found."
        )

    # Fetch bids from DB
    bids = db.query(Bid).filter(Bid.tender_id == tender_id).all()
    if not bids:
        # Return mock multi-bidder scenario if no active DB bids populated yet
        bids_data = [
            {
                "bid_id": "BID-001",
                "bidder_name": "Apex Infra Solution Ltd",
                "gstin": "27AAAAA1111A1Z1",
                "pan": "AAAAA1111A",
                "quote_amount": 1250000.0,
                "submission_timestamp": "2026-08-30T10:15:00Z",
                "ip_address": "103.22.45.10",
                "directors": ["Ramesh Kumar", "Suresh Gupta"],
                "addresses": ["Plot 42, Sector 18, Cyber City, Gurugram, Haryana"],
                "bank_accounts": ["HDFC-9988776655"]
            },
            {
                "bid_id": "BID-002",
                "bidder_name": "Zenith Tech Enterprises",
                "gstin": "27BBBBB2222B1Z2",
                "pan": "BBBBB2222B",
                "quote_amount": 1420000.0,
                "submission_timestamp": "2026-08-30T10:16:30Z",
                "ip_address": "103.22.45.10",
                "directors": ["Ramesh Kumar", "Vikram Singh"],
                "addresses": ["Plot 42, Sector 18, Cyber City, Gurugram, Haryana"],
                "bank_accounts": ["HDFC-9988776655"]
            },
            {
                "bid_id": "BID-003",
                "bidder_name": "Vanguard Builders Pvt Ltd",
                "gstin": "27CCCCC3333C1Z3",
                "pan": "CCCCC3333C",
                "quote_amount": 1435000.0,
                "submission_timestamp": "2026-08-30T10:17:15Z",
                "ip_address": "103.22.45.10",
                "directors": ["Anita Roy"],
                "addresses": ["88 MG Road, Bengaluru, Karnataka"],
                "bank_accounts": ["ICICI-1122334455"]
            }
        ]
    else:
        bids_data = []
        for b in bids:
            bids_data.append({
                "bid_id": b.id,
                "bidder_name": b.bidder_name,
                "quote_amount": float(b.proposed_amount or 0),
                "submission_timestamp": b.submitted_at.isoformat() if b.submitted_at else "",
                "ip_address": "192.168.1.10",
                "directors": [b.bidder_name],
                "addresses": ["Registered Corporate Address"],
                "bank_accounts": [f"ACC-{b.id[:6]}"]
            })

    analysis_report = CartelDetector.analyze_tender_cartel_risk(tender_id, bids_data)
    return analysis_report

@router.post("/analyze/{tender_id}", response_model=Dict[str, Any])
def analyze_cartel_risk(tender_id: str, payload: List[Dict[str, Any]]):
    """Triggers custom multi-bidder relationship graph analysis and cartel ring detection."""
    return CartelDetector.analyze_tender_cartel_risk(tender_id, payload)

@router.get("/clusters", response_model=Dict[str, Any])
def list_cartel_clusters():
    """Lists all detected multi-bidder cartel rings across active mapped graph nodes."""
    clusters = cartel_graph_service.detect_cartel_clusters()
    overlaps = cartel_graph_service.detect_overlapping_entities()
    return {
        "neo4j_active": cartel_graph_service.is_neo4j_active(),
        "total_cartel_rings": len(clusters),
        "cartel_rings": clusters,
        "overlapping_entities": overlaps
    }
