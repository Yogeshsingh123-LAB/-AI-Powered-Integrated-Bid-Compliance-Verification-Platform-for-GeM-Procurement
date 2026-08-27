from fastapi import APIRouter
import json
import os

router = APIRouter(prefix="/mock", tags=["Mock Government APIs"])

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "gst_db.json")

def load_db():
    if not os.path.exists(DB_PATH):
        return {}
    with open(DB_PATH, "r") as f:
        return json.load(f)

@router.get("/gst/{gstin}")
def verify_gst(gstin: str):
    gstin = gstin.upper().strip()
    db = load_db()
    result = db.get(gstin)
    
    if not result:
        return {
            "gstin": gstin,
            "status": "not_found",
            "returns_filed": None,
            "legal_name": None,
            "business_type": None,
            "registration_date": None,
            "message": "GSTIN not found in mock database."
        }
        
    return {
        "gstin": gstin,
        "status": result.get("status"),
        "returns_filed": result.get("returns_filed"),
        "legal_name": result.get("legal_name"),
        "business_type": result.get("business_type"),
        "registration_date": result.get("registration_date"),
        "message": "GSTIN retrieved successfully from mock registry."
    }
