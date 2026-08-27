import logging
import os
import json
import requests
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

# Base Mock API endpoint URL
BASE_MOCK_URL = "http://127.0.0.1:8000"

# Local JSON folder for offline fallback
MOCK_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "mock_apis", "data")

def get_local_db_record(db_name: str, key: str) -> Optional[Dict[str, Any]]:
    """Helper method to read from local JSON database files when the server is offline."""
    path = os.path.join(MOCK_DATA_DIR, f"{db_name}_db.json")
    if not os.path.exists(path):
        logger.warning(f"MockVerifier Fallback: Local database file not found at {path}")
        return None
    try:
        with open(path, "r") as f:
            db = json.load(f)
            # Check exact key lookup
            record = db.get(key)
            if record:
                return record
            # For blacklist lookup, support scanning enterprise name
            if db_name == "blacklist":
                for rec in db.values():
                    if rec.get("name", "").upper() == key.upper():
                        return rec
        return None
    except Exception as e:
        logger.error(f"MockVerifier Fallback: Failed to read local fallback DB {db_name}: {e}")
        return None

class MockVerifier:
    """
    Integrates queries with Government mock databases (GSTIN portal, 
    Income Tax e-filing PAN database, Udyam MSME Portal, and Blacklist Registry).
    Performs active REST requests to /mock endpoints with offline local file fallbacks.
    """

    @staticmethod
    def decode_pan_category(pan: str) -> str:
        """Decodes the 4th letter of a PAN card to check its taxpayer category."""
        if len(pan) < 4:
            return "Unknown"
        char = pan[3].upper()
        categories = {
            'C': "Company",
            'P': "Individual",
            'F': "Partnership Firm",
            'H': "Hindu Undivided Family (HUF)",
            'A': "Association of Persons (AOP)",
            'B': "Body of Individuals (BOI)",
            'G': "Government Agency",
            'J': "Artificial Juridical Person",
            'L': "Local Authority",
            'T': "Trust"
        }
        return categories.get(char, f"Other ({char})")

    @classmethod
    def check_blacklist(cls, identifier: str) -> Dict[str, Any]:
        """Queries the blacklist registry for PAN, GSTIN, or Business Name."""
        identifier = identifier.upper().strip()
        
        # 1. Active REST query
        try:
            response = requests.get(f"{BASE_MOCK_URL}/mock/blacklist/{identifier}", timeout=2.0)
            if response.status_code == 200:
                return response.json()
        except requests.exceptions.RequestException:
            logger.info("MockVerifier: Blacklist API offline, using local fallback.")
            
        # 2. Local fallback
        record = get_local_db_record("blacklist", identifier)
        if record:
            return record
            
        return {
            "identifier": identifier,
            "blacklisting_status": "Not Blacklisted",
            "authority": None,
            "order_number": None,
            "order_date": None,
            "valid_until": None,
            "message": "Assumed safe; not found in blacklist registry."
        }

    @classmethod
    def verify_gstin(cls, gstin: str) -> Dict[str, Any]:
        """Queries the GSTIN registry."""
        gstin = gstin.upper().strip()
        logger.info(f"MockVerifier: Verifying GSTIN: {gstin}")
        
        # 1. Active REST query
        try:
            response = requests.get(f"{BASE_MOCK_URL}/mock/gst/{gstin}", timeout=2.0)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") != "not_found":
                    # Inject blacklist check
                    blacklist = cls.check_blacklist(gstin)
                    data["blacklisted"] = blacklist.get("blacklisting_status") == "Blacklisted"
                    data["blacklist_details"] = blacklist
                    return {
                        "verified": True,
                        "found": True,
                        "data": data,
                        "message": "GSTIN verified successfully via REST API."
                    }
        except requests.exceptions.RequestException:
            logger.info("MockVerifier: GST API offline, using local fallback.")
            
        # 2. Local fallback
        record = get_local_db_record("gst", gstin)
        if record:
            blacklist = cls.check_blacklist(gstin)
            record["blacklisted"] = blacklist.get("blacklisting_status") == "Blacklisted"
            record["blacklist_details"] = blacklist
            return {
                "verified": True,
                "found": True,
                "data": record,
                "message": "GSTIN verified successfully via local database fallback."
            }
            
        return {
            "verified": False,
            "found": False,
            "data": {
                "gstin": gstin,
                "legal_name": "Unknown Entity",
                "trade_name": "Unknown Entity",
                "status": "Unverified",
                "business_type": "Unknown",
                "returns_filed": 0,
                "registration_date": "N/A"
            },
            "message": "GSTIN not found in mock database registry."
        }

    @classmethod
    def verify_pan(cls, pan: str) -> Dict[str, Any]:
        """Queries the PAN registry."""
        pan = pan.upper().strip()
        logger.info(f"MockVerifier: Verifying PAN: {pan}")
        
        decoded_cat = cls.decode_pan_category(pan)
        
        # 1. Active REST query
        try:
            response = requests.get(f"{BASE_MOCK_URL}/mock/pan/{pan}", timeout=2.0)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") != "not_found":
                    # Inject blacklist check
                    blacklist = cls.check_blacklist(pan)
                    data["blacklisted"] = blacklist.get("blacklisting_status") == "Blacklisted"
                    data["blacklist_details"] = blacklist
                    data["decoded_category"] = decoded_cat
                    return {
                        "verified": True,
                        "found": True,
                        "data": data,
                        "message": "PAN verified successfully via REST API."
                    }
        except requests.exceptions.RequestException:
            logger.info("MockVerifier: PAN API offline, using local fallback.")
            
        # 2. Local fallback
        record = get_local_db_record("pan", pan)
        if record:
            blacklist = cls.check_blacklist(pan)
            record["blacklisted"] = blacklist.get("blacklisting_status") == "Blacklisted"
            record["blacklist_details"] = blacklist
            record["decoded_category"] = decoded_cat
            return {
                "verified": True,
                "found": True,
                "data": record,
                "message": "PAN verified successfully via local database fallback."
            }
            
        return {
            "verified": False,
            "found": False,
            "data": {
                "pan": pan,
                "name": "Unknown Holder",
                "status": "Unverified",
                "category": decoded_cat,
                "date_of_issue": "N/A"
            },
            "message": "PAN not found in mock database registry."
        }

    @classmethod
    def verify_udyam(cls, udyam: str) -> Dict[str, Any]:
        """Queries the Udyam MSME registry."""
        udyam = udyam.upper().strip()
        logger.info(f"MockVerifier: Verifying Udyam: {udyam}")
        
        # 1. Active REST query
        try:
            response = requests.get(f"{BASE_MOCK_URL}/mock/udyam/{udyam}", timeout=2.0)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") != "not_found":
                    return {
                        "verified": True,
                        "found": True,
                        "data": data,
                        "message": "Udyam registration verified successfully via REST API."
                    }
        except requests.exceptions.RequestException:
            logger.info("MockVerifier: Udyam API offline, using local fallback.")
            
        # 2. Local fallback
        record = get_local_db_record("udyam", udyam)
        if record:
            return {
                "verified": True,
                "found": True,
                "data": record,
                "message": "Udyam registration verified successfully via local database fallback."
            }
            
        return {
            "verified": False,
            "found": False,
            "data": {
                "udyam_number": udyam,
                "enterprise_name": "Unknown Enterprise",
                "enterprise_type": "Unknown",
                "major_activity": "Unknown",
                "status": "Unverified",
                "date_of_registration": "N/A",
                "state": "Unknown",
                "district": "Unknown"
            },
            "message": "Udyam registration not found in mock database registry."
        }

    @classmethod
    def verify_all_identifiers(cls, ids: Dict[str, List[str]]) -> Dict[str, Any]:
        """Runs batch verification across GSTIN, PAN, and Udyam lists."""
        gstin_list = ids.get("gstin", [])
        pan_list = ids.get("pan", [])
        udyam_list = ids.get("udyam", [])

        # Auto-extract PAN from GSTIN if PAN is not separately present
        for gstin in gstin_list:
            if len(gstin) >= 12:
                pan_candidate = gstin[2:12].upper()
                if pan_candidate not in [p.upper() for p in pan_list]:
                    pan_list.append(pan_candidate)
        ids["pan"] = pan_list

        verified_results = {
            "gstin": [],
            "pan": [],
            "udyam": []
        }
        for g in gstin_list:
            verified_results["gstin"].append(cls.verify_gstin(g))
        for p in pan_list:
            verified_results["pan"].append(cls.verify_pan(p))
        for u in udyam_list:
            verified_results["udyam"].append(cls.verify_udyam(u))
        return verified_results

if __name__ == "__main__":
    # Test execution
    print("Testing MockVerifier with seeds:")
    sample = {
        "gstin": ["27AAPCS1234M1Z5", "22AAAAA1111A1Z1"],
        "pan": ["BBPPK5678Q"],
        "udyam": ["UDYAM-MH-12-0012345"]
    }
    print(json.dumps(MockVerifier.verify_all_identifiers(sample), indent=2))
