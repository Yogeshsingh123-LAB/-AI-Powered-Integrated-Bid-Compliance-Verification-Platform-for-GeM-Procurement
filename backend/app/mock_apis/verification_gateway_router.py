import re
import json
import os
from datetime import datetime
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional

router = APIRouter(prefix="/api/verify", tags=["Verification Gateway (Mock Govt APIs)"])

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

def load_db(filename: str) -> Dict[str, Any]:
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        return {}
    try:
        with open(path, "r") as f:
            return json.load(f)
    except Exception:
        return {}

# 1. GST Verification
@router.get("/gst/{gstin}")
def verify_gst_portal(gstin: str):
    gstin = gstin.upper().strip()
    db = load_db("gst_db.json")
    record = db.get(gstin)
    
    if record:
        return {
            "gstin": gstin,
            "legal_name": record.get("legal_name", "ABC Technologies Pvt Ltd"),
            "trade_name": record.get("trade_name", "ABC Tech"),
            "status": record.get("status", "ACTIVE").upper(),
            "registration_date": record.get("registration_date", "2021-04-12"),
            "business_type": record.get("business_type", "Private Limited"),
            "returns_filed": record.get("returns_filed", 12),
            "source": "GSTN-MOCK",
            "verified_at": datetime.utcnow().isoformat() + "Z"
        }
    
    # Synthesize fallback for dynamic valid formats
    if len(gstin) == 15:
        return {
            "gstin": gstin,
            "legal_name": "ABC Technologies Pvt Ltd",
            "trade_name": "ABC Tech",
            "status": "ACTIVE",
            "registration_date": "2021-04-12",
            "business_type": "Private Limited",
            "returns_filed": 12,
            "source": "GSTN-MOCK",
            "verified_at": datetime.utcnow().isoformat() + "Z"
        }
        
    return {
        "gstin": gstin,
        "legal_name": None,
        "status": "NOT_FOUND",
        "registration_date": None,
        "source": "GSTN-MOCK",
        "verified_at": datetime.utcnow().isoformat() + "Z",
        "error": "GSTIN not registered in GSTN portal database."
    }

# 2. PAN Verification
@router.get("/pan/{pan}")
def verify_pan_portal(pan: str):
    pan = pan.upper().strip()
    db = load_db("pan_db.json")
    record = db.get(pan)
    
    if record:
        return {
            "pan": pan,
            "legal_name": record.get("name", "ABC TECHNOLOGIES PRIVATE LIMITED"),
            "status": record.get("status", "ACTIVE").upper(),
            "category": record.get("category", "Company"),
            "date_of_issue": record.get("date_of_issue", "2018-03-15"),
            "source": "INCOME-TAX-IN-MOCK",
            "verified_at": datetime.utcnow().isoformat() + "Z"
        }
        
    if len(pan) == 10:
        return {
            "pan": pan,
            "legal_name": "ABC TECHNOLOGIES PRIVATE LIMITED",
            "status": "ACTIVE",
            "category": "Company",
            "date_of_issue": "2018-03-15",
            "source": "INCOME-TAX-IN-MOCK",
            "verified_at": datetime.utcnow().isoformat() + "Z"
        }
        
    return {
        "pan": pan,
        "legal_name": None,
        "status": "NOT_FOUND",
        "source": "INCOME-TAX-IN-MOCK",
        "verified_at": datetime.utcnow().isoformat() + "Z"
    }

# 3. Udyam Verification
@router.get("/udyam/{udyam_id}")
def verify_udyam_portal(udyam_id: str):
    udyam_id = udyam_id.upper().strip()
    db = load_db("udyam_db.json")
    record = db.get(udyam_id)
    
    if record:
        return {
            "udyam_number": udyam_id,
            "enterprise_name": record.get("enterprise_name", "ABC Technologies Private Limited"),
            "enterprise_category": record.get("enterprise_type", "Micro"),
            "major_activity": record.get("major_activity", "Services"),
            "status": record.get("status", "ACTIVE").upper(),
            "registration_date": record.get("date_of_registration", "2020-07-02"),
            "source": "UDYAM-MSME-MOCK",
            "verified_at": datetime.utcnow().isoformat() + "Z"
        }
        
    return {
        "udyam_number": udyam_id,
        "enterprise_name": "ABC Technologies Private Limited",
        "enterprise_category": "Micro",
        "major_activity": "Services",
        "status": "ACTIVE",
        "registration_date": "2020-07-02",
        "source": "UDYAM-MSME-MOCK",
        "verified_at": datetime.utcnow().isoformat() + "Z"
    }

# 4. MCA / Corporate Verification
@router.get("/mca/{cin}")
def verify_mca_portal(cin: str):
    cin = cin.upper().strip()
    return {
        "cin": cin,
        "company_name": "ABC TECHNOLOGIES PRIVATE LIMITED",
        "company_status": "ACTIVE",
        "incorporation_date": "2018-02-14",
        "company_category": "Company limited by Shares",
        "authorized_capital": 5000000.0,
        "paid_up_capital": 1000000.0,
        "source": "MCA21-MOCK",
        "verified_at": datetime.utcnow().isoformat() + "Z"
    }

# 5. EPFO Compliance Verification
@router.get("/epfo/{epfo_id}")
def verify_epfo_portal(epfo_id: str):
    epfo_id = epfo_id.upper().strip()
    # Check if this is the deliberate mismatch test ID
    if "MISMATCH" in epfo_id or "FLAG" in epfo_id:
        return {
            "employer_id": epfo_id,
            "employer_name": "ABC INFRASTRUCTURE AND TECH SERVICES PVT LTD",
            "compliance_status": "PENDING_REMITTANCE",
            "active_members": 42,
            "last_return_month": "2026-05",
            "source": "EPFO-MOCK",
            "verified_at": datetime.utcnow().isoformat() + "Z",
            "warning": "Legal name variation detected: 'ABC Infrastructure and Tech Services' vs 'ABC Technologies Private Limited'."
        }
        
    return {
        "employer_id": epfo_id,
        "employer_name": "ABC TECHNOLOGIES PRIVATE LIMITED",
        "compliance_status": "COMPLIANT",
        "active_members": 48,
        "last_return_month": "2026-08",
        "source": "EPFO-MOCK",
        "verified_at": datetime.utcnow().isoformat() + "Z"
    }

# 6. ESIC Compliance Verification
@router.get("/esic/{esic_id}")
def verify_esic_portal(esic_id: str):
    esic_id = esic_id.upper().strip()
    return {
        "employer_number": esic_id,
        "employer_name": "ABC TECHNOLOGIES PRIVATE LIMITED",
        "compliance_status": "COMPLIANT",
        "covered_employees": 35,
        "source": "ESIC-MOCK",
        "verified_at": datetime.utcnow().isoformat() + "Z"
    }

# 7. Startup India Verification
@router.get("/startup/{dippt_id}")
def verify_startup_portal(dippt_id: str):
    dippt_id = dippt_id.upper().strip()
    return {
        "dippt_number": dippt_id,
        "startup_name": "ABC Technologies Private Limited",
        "recognition_status": "RECOGNIZED",
        "tax_exemption_status": "APPROVED",
        "category": "IT Services & AI",
        "source": "STARTUP-INDIA-MOCK",
        "verified_at": datetime.utcnow().isoformat() + "Z"
    }

# 8. NSIC Registration Verification
@router.get("/nsic/{nsic_id}")
def verify_nsic_portal(nsic_id: str):
    nsic_id = nsic_id.upper().strip()
    return {
        "nsic_number": nsic_id,
        "unit_name": "ABC Technologies Private Limited",
        "store_details": "Supply of IT Hardware & Industrial Safety Devices",
        "validity_to": "2027-12-31",
        "status": "VALID",
        "source": "NSIC-MOCK",
        "verified_at": datetime.utcnow().isoformat() + "Z"
    }

# 9. Blacklist / Debarment Registry Verification
@router.get("/blacklist/{identifier}")
def verify_blacklist_portal(identifier: str):
    identifier = identifier.upper().strip()
    db = load_db("blacklist_db.json")
    record = db.get(identifier)
    
    if record and record.get("blacklisting_status") == "Blacklisted":
        return {
            "identifier": identifier,
            "blacklisting_status": "BLACKLISTED",
            "authority": record.get("authority", "GeM SPV Administration"),
            "order_number": record.get("order_number", "GEM/BL/2025/ORD-9021"),
            "order_date": record.get("order_date", "2025-01-10"),
            "valid_until": record.get("valid_until", "2028-01-10"),
            "reason": "Default in contract fulfillment on GeM Portal",
            "source": "CENTRAL-DEBARMENT-REGISTRY-MOCK",
            "verified_at": datetime.utcnow().isoformat() + "Z"
        }
        
    return {
        "identifier": identifier,
        "blacklisting_status": "NOT_BLACKLISTED",
        "authority": None,
        "order_number": None,
        "order_date": None,
        "valid_until": None,
        "message": "No debarment records found in Central Debarment Database.",
        "source": "CENTRAL-DEBARMENT-REGISTRY-MOCK",
        "verified_at": datetime.utcnow().isoformat() + "Z"
    }

# 10. DigiLocker Document Verification
@router.get("/digilocker/{doc_id}")
def verify_digilocker_document(doc_id: str):
    doc_id = doc_id.upper().strip()
    return {
        "digilocker_id": doc_id,
        "doc_type": "GST_REGISTRATION_CERTIFICATE",
        "issuer": "Central Board of Indirect Taxes and Customs (CBIC)",
        "issued_to": "ABC TECHNOLOGIES PRIVATE LIMITED",
        "signature_valid": True,
        "timestamp": "2021-04-12T10:00:00Z",
        "source": "DIGILOCKER-OFFICIAL-MOCK",
        "verified_at": datetime.utcnow().isoformat() + "Z"
    }
