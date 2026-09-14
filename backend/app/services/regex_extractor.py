import logging
from typing import Dict, List, Any
from app.ai_engine import EntityExtractor

logger = logging.getLogger(__name__)

class RegexExtractor:
    """
    Wrapper for backward compatibility, delegating to app.ai_engine.EntityExtractor.
    """
    @classmethod
    def extract_identifiers(cls, text: str) -> Dict[str, List[str]]:
        return EntityExtractor.extract_identifiers(text)

    @classmethod
    def extract_all_fields(cls, text: str, document_type: str) -> Dict[str, Any]:
        import re
        identifiers = EntityExtractor.extract_identifiers(text or "")
        fields = {}
        
        doc_type_upper = (document_type or "").upper()
        if "PAN" in doc_type_upper or doc_type_upper == "PAN":
            pans = identifiers.get("pan", [])
            if pans:
                fields["pan_number"] = pans[0]
            name_match = re.search(r"Name\s*:\s*([A-Z\s]+)", text, re.IGNORECASE)
            if name_match:
                fields["name"] = name_match.group(1).strip()
        elif "GST" in doc_type_upper:
            gstins = identifiers.get("gstin", [])
            if gstins:
                fields["gstin"] = gstins[0]
        elif "UDYAM" in doc_type_upper:
            udyams = identifiers.get("udyam", [])
            if udyams:
                fields["udyam_registration_number"] = udyams[0]

        if "pan_number" not in fields:
            pans = identifiers.get("pan", [])
            if pans:
                fields["pan_number"] = pans[0]

        return {
            "document_type": document_type,
            "fields": fields,
            "confidence": 0.85 if fields else 0.0,
            "missing_fields": [],
            "requires_review": False if fields else True
        }

if __name__ == "__main__":
    print("RegexExtractor wrapper compiled successfully.")
