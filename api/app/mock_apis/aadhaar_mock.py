import os
import re
import json
import logging

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/mock/aadhaar", tags=["Mock Government Gateway - UIDAI Aadhaar Portal"])

DATA_FILE = os.path.join(os.path.dirname(__file__), "data", "aadhaar_db.json")
AADHAAR_REGEX = re.compile(r'^\d{12}$')

def load_aadhaar_db():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r") as f:
            return json.load(f)
    return {}

@router.get("/{aadhaar_number}")
def get_aadhaar_record(aadhaar_number: str):
    clean_aadhaar = aadhaar_number.replace(" ", "").replace("-", "").strip()
    if not AADHAAR_REGEX.match(clean_aadhaar):
        raise HTTPException(status_code=400, detail="Invalid Aadhaar format. Expected 12-digit number.")
        
    db = load_aadhaar_db()
    
    # Direct match or formatted match
    for key, record in db.items():
        if key.replace(" ", "") == clean_aadhaar:
            return record

    return {
        "aadhaar_number": aadhaar_number,
        "status": "not_found",
        "message": "Aadhaar number not found in UIDAI registry database."
    }

