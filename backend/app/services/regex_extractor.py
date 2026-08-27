import re
import logging
from typing import Dict, List, Set, Any

logger = logging.getLogger(__name__)

class RegexExtractor:
    """
    Utility class to extract Indian Government identifiers (GSTIN, PAN, Udyam)
    from text using robust regular expression patterns.
    """
    
    # Regex Patterns (compiled for performance, case-insensitive)
    # GSTIN: 2 digits, 5 letters, 4 digits, 1 letter, 1 alpha-num, 'Z', 1 alpha-num
    GSTIN_PATTERN = re.compile(r"\b(\d{2}([A-Z]{5}\d{4}[A-Z]{1})[A-Z\d]{1}Z[A-Z\d]{1})\b", re.IGNORECASE)
    
    # PAN: 5 letters, 4 digits, 1 letter
    PAN_PATTERN = re.compile(r"\b([A-Z]{5}\d{4}[A-Z]{1})\b", re.IGNORECASE)
    
    # Udyam: "UDYAM" prefix, 2-letter state code, 2-digit district code, 7-digit serial number
    UDYAM_PATTERN = re.compile(r"\b(UDYAM-[A-Z]{2}-\d{2}-\d{7})\b", re.IGNORECASE)

    @classmethod
    def extract_identifiers(cls, text: str) -> Dict[str, List[str]]:
        """
        Extracts all GSTIN, PAN, and Udyam numbers from the input text.
        It also filters out PAN numbers that are already part of extracted GSTINs 
        to avoid redundant or false matches.
        
        Args:
            text (str): Raw text from bid documents.
            
        Returns:
            Dict[str, List[str]]: Dictionary with lists of unique extracted IDs.
        """
        if not text:
            return {"gstin": [], "pan": [], "udyam": []}
            
        logger.info("Starting regular expression extraction of identifiers...")

        # 1. Extract GSTINs
        gstin_matches = cls.GSTIN_PATTERN.findall(text)
        # cls.GSTIN_PATTERN.findall returns tuples because of capture groups. 
        # First group is the whole GSTIN, second group is the embedded PAN.
        gstins: Set[str] = set()
        embedded_pans: Set[str] = set()
        
        for match in gstin_matches:
            full_gstin = match[0].upper()
            embedded_pan = match[1].upper()
            gstins.add(full_gstin)
            embedded_pans.add(embedded_pan)
            
        # 2. Extract PANs
        pan_matches = cls.PAN_PATTERN.findall(text)
        raw_pans = {pan.upper() for pan in pan_matches}
        
        # Filter out PANs that are embedded inside the extracted GSTINs
        # (Since GSTIN contains the owner's PAN, we don't want to list it twice unless it appears separately)
        standalone_pans = raw_pans - embedded_pans

        # 3. Extract Udyam Registration Numbers
        udyam_matches = cls.UDYAM_PATTERN.findall(text)
        udyam_numbers = {udyam.upper() for udyam in udyam_matches}
        
        results = {
            "gstin": sorted(list(gstins)),
            "pan": sorted(list(standalone_pans)),
            "udyam": sorted(list(udyam_numbers))
        }
        
        logger.info(
            f"Extraction completed. Found {len(results['gstin'])} GSTIN(s), "
            f"{len(results['pan'])} PAN(s), and {len(results['udyam'])} Udyam number(s)."
        )
        
        return results

if __name__ == "__main__":
    # Simple verification logic
    test_text = """
    Company Profile & Bid Document details:
    GSTIN of bidder: 27AAPCS1234M1Z5 (Maharashtra State GST)
    Independent PAN: BBPPK5678Q (Director PAN)
    Proprietor PAN: AAPCS1234M (Should be filtered out since it belongs to GSTIN above)
    Udyam registration: UDYAM-MH-12-0012345
    Second Udyam Reg (lowercase check): udyam-dl-01-0098765
    """
    
    print("Testing RegexExtractor:")
    extracted = RegexExtractor.extract_identifiers(test_text)
    print(extracted)
