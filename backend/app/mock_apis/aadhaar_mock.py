import os
import json
import logging
from fastapi import APIRouter, HTTPException

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/mock/aadhaar", tags=["Mock Government Gateway - UIDAI Aadhaar Portal"])

DATA_FILE = os.path.join(os.path.dirname(__file__), "data", "aadhaar_db.json")

def load_aadhaar_db():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r") as f:
            return json.load(f)
    return {}

@router.get("/{aadhaar_number}")
def get_aadhaar_record(aadhaar_number: str):
    clean_aadhaar = aadhaar_number.replace(" ", "").replace("-", "").strip()
    db = load_aadhaar_db()
    
    # Direct match or formatted match
    for key, record in db.items():
        if key.replace(" ", "") == clean_aadhaar:
            return record

    # Fallback response for syntactically valid 12-digit Aadhaar
    if len(clean_aadhaar) == 12 and clean_aadhaar.isdigit():
        return {
            "aadhaar_number": f"{clean_aadhaar[:4]} {clean_aadhaar[4:8]} {clean_aadhaar[8:]}",
            "name": "Verified Holder",
            "status": "Active",
            "gender": "Verified",
            "state": "India",
            "verification_status": "Verified (UIDAI Mock)"
        }

    return {
        "aadhaar_number": aadhaar_number,
        "status": "not_found",
        "message": "Aadhaar number not found in UIDAI registry database."
    }
