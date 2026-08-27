import logging
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)

# Mock Government Databases
MOCK_GSTIN_DB: Dict[str, Dict[str, Any]] = {
    "27AAPCS1234M1Z5": {
        "gstin": "27AAPCS1234M1Z5",
        "legal_name": "Acme Tech Solutions Private Limited",
        "trade_name": "Acme Tech",
        "status": "Active",
        "taxpayer_type": "Regular",
        "state_code": "27",
        "state_name": "Maharashtra",
        "date_of_registration": "2018-04-12",
        "compliance_record": "Excellent",
        "is_valid": True
    },
    "22AAAAA1111A1Z1": {
        "gstin": "22AAAAA1111A1Z1",
        "legal_name": "Global Traders Inc",
        "trade_name": "Global Traders",
        "status": "Suspended",  # Simulated risk condition
        "taxpayer_type": "Regular",
        "state_code": "22",
        "state_name": "Chhattisgarh",
        "date_of_registration": "2020-09-01",
        "compliance_record": "Poor",
        "blacklisted": True,
        "is_valid": True
    }
}

MOCK_PAN_DB: Dict[str, Dict[str, Any]] = {
    "AAPCS1234M": {
        "pan": "AAPCS1234M",
        "name": "Acme Tech Solutions Private Limited",
        "status": "Active",
        "category": "Company",
        "date_of_issue": "2018-03-15",
        "is_valid": True
    },
    "AAAAA1111A": {
        "pan": "AAAAA1111A",
        "name": "Global Traders Inc",
        "status": "Active",
        "category": "Company",
        "date_of_issue": "2020-08-10",
        "is_valid": True
    },
    "BBPPK5678Q": {
        "pan": "BBPPK5678Q",
        "name": "John Doe (Director)",
        "status": "Active",
        "category": "Individual",
        "date_of_issue": "2015-05-20",
        "is_valid": True
    }
}

MOCK_UDYAM_DB: Dict[str, Dict[str, Any]] = {
    "UDYAM-MH-12-0012345": {
        "udyam_number": "UDYAM-MH-12-0012345",
        "enterprise_name": "Acme Tech Solutions Private Limited",
        "enterprise_type": "Micro",
        "major_activity": "Services",
        "status": "Active",
        "date_of_registration": "2020-07-02",
        "state": "Maharashtra",
        "is_valid": True
    },
    "UDYAM-DL-01-0098765": {
        "udyam_number": "UDYAM-DL-01-0098765",
        "enterprise_name": "Global Traders Inc",
        "enterprise_type": "Small",
        "major_activity": "Manufacturing",
        "status": "Active",
        "date_of_registration": "2021-02-14",
        "state": "Delhi",
        "is_valid": True
    }
}

class MockVerifier:
    """
    Simulates direct API integrations with Government databases (GSTIN portal, 
    Income Tax e-filing PAN database, and Udyam MSME Portal).
    """

    @staticmethod
    def decode_pan_category(pan: str) -> str:
        """
        Decodes the 4th letter of a PAN card to check its taxpayer category.
        Standard classifications:
        C - Company, P - Individual, F - Firm, H - HUF, T - Trust, etc.
        """
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
    def verify_gstin(cls, gstin: str) -> Dict[str, Any]:
        """Queries the mock GSTIN registry."""
        gstin = gstin.upper().strip()
        logger.info(f"Verifying GSTIN: {gstin}")
        
        if gstin in MOCK_GSTIN_DB:
            return {
                "verified": True,
                "found": True,
                "data": MOCK_GSTIN_DB[gstin],
                "message": "GSTIN verified successfully."
            }
        
        # Fallback simulation for general valid-looking inputs
        return {
            "verified": False,
            "found": False,
            "data": {
                "gstin": gstin,
                "legal_name": "Unknown Entity",
                "trade_name": "Unknown Entity",
                "status": "Unverified",
                "taxpayer_type": "Unknown",
                "state_code": gstin[:2] if len(gstin) >= 2 else "Unknown",
                "state_name": "Unknown",
                "date_of_registration": "N/A",
                "compliance_record": "Unknown",
                "is_valid": False
            },
            "message": "GSTIN not found in mock database."
        }

    @classmethod
    def verify_pan(cls, pan: str) -> Dict[str, Any]:
        """Queries the mock PAN registry."""
        pan = pan.upper().strip()
        logger.info(f"Verifying PAN: {pan}")
        
        decoded_cat = cls.decode_pan_category(pan)
        
        if pan in MOCK_PAN_DB:
            record = MOCK_PAN_DB[pan].copy()
            record["decoded_category"] = decoded_cat
            return {
                "verified": True,
                "found": True,
                "data": record,
                "message": "PAN verified successfully."
            }
            
        return {
            "verified": False,
            "found": False,
            "data": {
                "pan": pan,
                "name": "Unknown Holder",
                "status": "Unverified",
                "category": decoded_cat,
                "date_of_issue": "N/A",
                "is_valid": False
            },
            "message": "PAN not found in mock database."
        }

    @classmethod
    def verify_udyam(cls, udyam: str) -> Dict[str, Any]:
        """Queries the mock Udyam MSME registry."""
        udyam = udyam.upper().strip()
        logger.info(f"Verifying Udyam: {udyam}")
        
        if udyam in MOCK_UDYAM_DB:
            return {
                "verified": True,
                "found": True,
                "data": MOCK_UDYAM_DB[udyam],
                "message": "Udyam registration verified successfully."
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
                "is_valid": False
            },
            "message": "Udyam registration not found in mock database."
        }

    @classmethod
    def verify_all_identifiers(cls, ids: Dict[str, List[str]]) -> Dict[str, Any]:
        """
        Runs batch verification across a list of extracted IDs.
        """
        verified_results = {
            "gstin": [],
            "pan": [],
            "udyam": []
        }
        
        for g in ids.get("gstin", []):
            verified_results["gstin"].append(cls.verify_gstin(g))
            
        for p in ids.get("pan", []):
            verified_results["pan"].append(cls.verify_pan(p))
            
        for u in ids.get("udyam", []):
            verified_results["udyam"].append(cls.verify_udyam(u))
            
        return verified_results

if __name__ == "__main__":
    print("Testing MockVerifier:")
    sample_ids = {
        "gstin": ["27AAPCS1234M1Z5", "99ABCDE1234F1Z0"],
        "pan": ["BBPPK5678Q"],
        "udyam": ["UDYAM-MH-12-0012345"]
    }
    results = MockVerifier.verify_all_identifiers(sample_ids)
    import json
    print(json.dumps(results, indent=2))
