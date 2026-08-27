# pyrefly: ignore [missing-import]
from fastapi import APIRouter
import json
import os

router = APIRouter(prefix="/mock", tags=["Mock Government APIs"])

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "blacklist_db.json")

def load_db():
    if not os.path.exists(DB_PATH):
        return {}
    with open(DB_PATH, "r") as f:
        return json.load(f)

@router.get("/blacklist/{identifier}")
def verify_blacklist(identifier: str):
    identifier_upper = identifier.upper().strip()
    db = load_db()
    
    # Try exact key lookup (which handles PAN/GSTIN keys)
    result = db.get(identifier_upper)
    
    # Fallback to scanning for matching legal name
    if not result:
        for record in db.values():
            if record.get("name", "").upper() == identifier_upper:
                result = record
                break
                
    if not result:
        return {
            "identifier": identifier,
            "blacklisting_status": "Not Blacklisted",
            "authority": None,
            "order_number": None,
            "order_date": None,
            "valid_until": None,
            "message": "Identifier not found in blacklist registry; assumed safe."
        }
        
    return {
        "identifier": identifier,
        "blacklisting_status": result.get("blacklisting_status"),
        "authority": result.get("authority"),
        "order_number": result.get("order_number"),
        "order_date": result.get("order_date"),
        "valid_until": result.get("valid_until"),
        "message": f"Blacklist query complete. Status: {result.get('blacklisting_status')}."
    }
