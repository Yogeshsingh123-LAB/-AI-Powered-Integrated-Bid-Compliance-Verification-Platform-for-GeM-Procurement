import re
import json
import os
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/mock", tags=["Mock Government APIs"])

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "pan_db.json")
PAN_REGEX = re.compile(r'^[A-Z]{5}\d{4}[A-Z]$')

def load_db():
    if not os.path.exists(DB_PATH):
        return {}
    with open(DB_PATH, "r") as f:
        return json.load(f)

@router.get("/pan/{pan}")
def verify_pan(pan: str):
    pan = pan.upper().strip()
    if not PAN_REGEX.match(pan):
        raise HTTPException(status_code=400, detail="Invalid PAN format. Expected 10-character structure.")
    db = load_db()
    result = db.get(pan)
    
    if not result:
        return {
            "pan": pan,
            "status": "not_found",
            "name": None,
            "category": None,
            "date_of_issue": None,
            "message": "PAN not found in mock database."
        }
        
    return {
        "pan": pan,
        "status": result.get("status"),
        "name": result.get("name"),
        "category": result.get("category"),
        "date_of_issue": result.get("date_of_issue"),
        "message": "PAN retrieved successfully from mock registry."
    }
