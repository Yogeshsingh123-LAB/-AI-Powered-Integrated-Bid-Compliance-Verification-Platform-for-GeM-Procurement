import re
import logging
import os
from typing import Dict, List, Set, Any, Optional
try:
    import spacy
except ImportError:
    spacy = None

logger = logging.getLogger(__name__)

# Initialize spaCy model globally
nlp = None
if spacy:
    try:
        nlp = spacy.load("en_core_web_sm")
        logger.info("EntityExtractor: Loaded spaCy model 'en_core_web_sm'.")
    except OSError:
        logger.warning("EntityExtractor: 'en_core_web_sm' model not found. Attempting to download it via spaCy...")
        try:
            import subprocess
            import sys
            subprocess.check_call([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
            nlp = spacy.load("en_core_web_sm")
            logger.info("EntityExtractor: Downloaded and loaded spaCy model 'en_core_web_sm'.")
        except Exception as download_err:
            logger.warning(f"EntityExtractor: 'spacy download' failed: {download_err}. Attempting direct pip install fallback...")
            try:
                import subprocess
                import sys
                model_url = "https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.7.0/en_core_web_sm-3.7.0.tar.gz"
                subprocess.check_call([sys.executable, "-m", "pip", "install", model_url])
                nlp = spacy.load("en_core_web_sm")
                logger.info("EntityExtractor: Successfully downloaded and loaded model via pip direct URL fallback!")
            except Exception as pip_err:
                logger.error(f"EntityExtractor: Direct pip download also failed: {pip_err}. Falling back to blank model.")
                nlp = spacy.blank("en")
else:
    logger.warning("EntityExtractor: spaCy is not installed. Named Entity Recognition features will be disabled/mocked.")

class EntityExtractor:
    # Regex Patterns for Indian Govt Identifiers
    GSTIN_PATTERN = re.compile(r"\b(\d{2}([A-Z]{5}\d{4}[A-Z]{1})[A-Z\d]{1}Z[A-Z\d]{1})\b", re.IGNORECASE)
    PAN_PATTERN = re.compile(r"\b([A-Z]{5}\d{4}[A-Z]{1})\b", re.IGNORECASE)
    UDYAM_PATTERN = re.compile(r"\b(UDYAM-[A-Z]{2}-\d{2}-\d{7})\b", re.IGNORECASE)
    AADHAAR_PATTERN = re.compile(r"\b([2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4})\b")

    @classmethod
    def extract_identifiers(cls, text: str) -> Dict[str, List[str]]:
        """Extracts GSTIN, PAN, Udyam, and Aadhaar registration numbers using Regex."""
        if not text:
            return {"gstin": [], "pan": [], "udyam": [], "aadhaar": []}
            
        # 1. GSTIN
        gstin_matches = cls.GSTIN_PATTERN.findall(text)
        gstins = set()
        embedded_pans = set()
        for match in gstin_matches:
            full_gstin = match[0].upper()
            embedded_pan = match[1].upper()
            gstins.add(full_gstin)
            embedded_pans.add(embedded_pan)
            
        # 2. PAN
        pan_matches = cls.PAN_PATTERN.findall(text)
        raw_pans = {pan.upper() for pan in pan_matches}
        standalone_pans = raw_pans - embedded_pans
        
        # 3. Udyam
        udyam_matches = cls.UDYAM_PATTERN.findall(text)
        udyam_numbers = {udyam.upper() for udyam in udyam_matches}
        
        # 4. Aadhaar
        aadhaar_matches = cls.AADHAAR_PATTERN.findall(text)
        aadhaar_numbers = set()
        for match in aadhaar_matches:
            clean_aadhaar = re.sub(r"[\s-]", "", match)
            if len(clean_aadhaar) == 12:
                # Format as XXXX XXXX XXXX
                formatted = f"{clean_aadhaar[:4]} {clean_aadhaar[4:8]} {clean_aadhaar[8:]}"
                aadhaar_numbers.add(formatted)
        
        return {
            "gstin": sorted(list(gstins)),
            "pan": sorted(list(standalone_pans)),
            "udyam": sorted(list(udyam_numbers)),
            "aadhaar": sorted(list(aadhaar_numbers))
        }

    @classmethod
    def extract_entities_spacy(cls, text: str) -> Dict[str, List[str]]:
        """Extracts named entities like Organization names (ORG), Dates (DATE), and Locations (GPE) using spaCy."""
        results = {
            "organizations": [],
            "dates": [],
            "locations": [],
            "money_or_percentage": []
        }
        
        if not text or not nlp:
            return results
            
        # Limit text length to prevent memory overload in spaCy (e.g., max 100,000 characters)
        doc = nlp(text[:100000])
        
        orgs = set()
        dates = set()
        gpes = set()
        money_pct = set()
        
        for ent in doc.ents:
            val = ent.text.strip().replace("\n", " ")
            if len(val) < 2:
                continue
                
            if ent.label_ == "ORG":
                orgs.add(val)
            elif ent.label_ == "DATE":
                dates.add(val)
            elif ent.label_ in {"GPE", "LOC"}:
                gpes.add(val)
            elif ent.label_ in {"MONEY", "PERCENT", "QUANTITY"}:
                money_pct.add(val)
                
        results["organizations"] = sorted(list(orgs))
        results["dates"] = sorted(list(dates))
        results["locations"] = sorted(list(gpes))
        results["money_or_percentage"] = sorted(list(money_pct))
        
        return results

    @classmethod
    def extract_all(cls, text: str) -> Dict[str, Any]:
        """Combines Regex and spaCy extraction into a single dictionary."""
        identifiers = cls.extract_identifiers(text)
        entities = cls.extract_entities_spacy(text)
        
        return {
            "identifiers": identifiers,
            "entities": entities
        }
