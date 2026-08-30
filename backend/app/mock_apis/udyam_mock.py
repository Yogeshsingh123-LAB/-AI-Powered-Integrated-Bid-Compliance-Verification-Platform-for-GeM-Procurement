import re
import json
import os
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/mock", tags=["Mock Government APIs"])

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "udyam_db.json")
UDYAM_REGEX = re.compile(r'^UDYAM-[A-Z]{2}-\d{2}-\d{7}$', re.IGNORECASE)

def load_db():
    if not os.path.exists(DB_PATH):
        return {}
    with open(DB_PATH, "r") as f:
        return json.load(f)

@router.get("/udyam/{udyam_number}")
def verify_udyam(udyam_number: str):
    udyam_number = udyam_number.upper().strip()
    if not UDYAM_REGEX.match(udyam_number):
        raise HTTPException(status_code=400, detail="Invalid Udyam format. Expected UDYAM-XX-00-0000000 structure.")

    db = load_db()
    result = db.get(udyam_number)
    
    if not result:
        return {
            "udyam_number": udyam_number,
            "status": "not_found",
            "enterprise_name": None,
            "enterprise_type": None,
            "major_activity": None,
            "date_of_registration": None,
            "state": None,
            "district": None,
            "message": "Udyam registration not found in mock database."
        }
        
    return {
        "udyam_number": udyam_number,
        "status": result.get("status"),
        "enterprise_name": result.get("enterprise_name"),
        "enterprise_type": result.get("enterprise_type"),
        "major_activity": result.get("major_activity"),
        "date_of_registration": result.get("date_of_registration"),
        "state": result.get("state"),
        "district": result.get("district"),
        "message": "Udyam registration retrieved successfully from mock registry."
    }

