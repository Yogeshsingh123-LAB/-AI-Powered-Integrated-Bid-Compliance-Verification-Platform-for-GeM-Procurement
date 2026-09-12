import re
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class DocumentClassifier:
    # Key-word list mapping for rule-based classification
    KEYWORDS = {
        "GST_CERTIFICATE": [
            r"goods\s+and\s+services\s+tax", 
            r"gstin", 
            r"form\s+gst-reg-06", 
            r"gst\s+registration",
            r"registration\s+certificate\s+issued\s+under\s+gst"
        ],
        "GST_RETURN": [
            r"gstr-1", 
            r"gstr-3b", 
            r"gst\s+return", 
            r"filing\s+date", 
            r"acknowledgement\s+number\s+of\s+gstr"
        ],
        "PAN": [
            r"permanent\s+account\s+number", 
            r"income\s+tax\s+department", 
            r"pan\s+card",
            r"\b[A-Z]{5}\d{4}[A-Z]{1}\b"  # PAN Format regex
        ],
        "UDYAM": [
            r"udyam", 
            r"msme", 
            r"enterprise\s+registration", 
            r"udyam\s+registration\s+certificate"
        ],
        "AADHAAR": [
            r"aadhaar",
            r"uidai",
            r"unique\s+identification\s+authority\s+of\s+india",
            r"aadhaar\s+card",
            r"aadhaar\s+number",
            r"\b[2-9]\d{3}\s?\d{4}\s?\d{4}\b"
        ],
        "INCOME_TAX": [
            r"income\s+tax\s+return", 
            r"itr-v", 
            r"assessment\s+year", 
            r"\bitr\b", 
            r"acknowledgement\s+number\b"
        ],
        "EPFO": [
            r"epfo", 
            r"employees\'\s+provident\s+fund", 
            r"establishment\s+code", 
            r"trrn",
            r"provident\s+fund\s+organisation"
        ],
        "ESIC": [
            r"esic", 
            r"employees\'\s+state\s+insurance", 
            r"employer\'s\s+code\s+no", 
            r"employer\s+registration\s+card"
        ],
        "STARTUP_INDIA": [
            r"startup\s+india", 
            r"dpiit\s+recognition", 
            r"certificate\s+of\s+recognition", 
            r"recognition\s+number\s+dipp",
            r"ministry\s+of\s+commerce\s+and\s+industry"
        ],
        "NSIC": [
            r"nsic", 
            r"national\s+small\s+industries\s+corporation", 
            r"government\s+purchase\s+registration",
            r"single\s+point\s+registration\s+scheme"
        ],
        "OEM_AUTHORIZATION": [
            r"oem\s+authorization", 
            r"authorized\s+bidder", 
            r"authorization\s+number", 
            r"manufacturer\'s\s+authorization",
            r"original\s+equipment\s+manufacturer",
            r"authorize\s+us\s+to\s+bid"
        ],
        "MAKE_IN_INDIA": [
            r"make\s+in\s+india", 
            r"local\s+content", 
            r"class-i\s+local\s+supplier", 
            r"class-ii\s+local\s+supplier",
            r"declaration\s+of\s+local\s+content"
        ],
        "BIS": [
            r"bureau\s+of\s+indian\s+standards", 
            r"bis\s+certification", 
            r"\bis/iso\b", 
            r"conformity\s+assessment",
            r"standard\s+mark"
        ],
        "DPIIT": [
            r"dpiit", 
            r"dpiit\s+registration", 
            r"land\s+border\s+share",
            r"border\s+with\s+india",
            r"registration\s+with\s+competent\s+authority"
        ],
        "BLACKLIST_DECLARATION": [
            r"blacklisting", 
            r"not\s+blacklisted", 
            r"debarred", 
            r"not\s+banned", 
            r"never\s+blacklisted",
            r"declaration\s+of\s+blacklisting"
        ]
    }

    @classmethod
    def classify(cls, text: str) -> Dict[str, Any]:
        """Classify document type using keywords first, then fall back to AI if ambiguous."""
        if not text:
            return {"document_type": "OTHER", "confidence": 0.5}

        # Normalize text for rule matching
        text_lower = text.lower()
        
        matches = {}
        for doc_type, regexes in cls.KEYWORDS.items():
            count = 0
            for r in regexes:
                matches_found = re.findall(r, text_lower)
                count += len(matches_found)
            if count > 0:
                matches[doc_type] = count

        if matches:
            # Sort by number of keyword occurrences
            sorted_matches = sorted(matches.items(), key=lambda x: x[1], reverse=True)
            best_match, max_count = sorted_matches[0]
            
            # Confidence calculation based on relative dominance of the top match
            total_matches = sum(matches.values())
            confidence = max_count / total_matches
            
            # Scale confidence: higher matches of keywords = higher confidence
            if max_count >= 3:
                confidence = min(0.95, confidence + 0.1)
            else:
                confidence = min(0.85, confidence)
                
            # If the best match is clear and confidence is high, return it
            if confidence >= 0.8:
                return {
                    "document_type": best_match,
                    "confidence": round(confidence, 2)
                }
            
            # If ambiguous but we have a lead, save it as a candidate for AI fallback
            candidate = best_match
            candidate_confidence = confidence
        else:
            candidate = "OTHER"
            candidate_confidence = 0.5

        # AI Fallback for ambiguous or OTHER documents
        try:
            from app.services.ai_extraction_service import AIExtractionService
            ai_type = AIExtractionService.classify_document_type_ai(text[:4000])
            if ai_type and ai_type != "OTHER":
                return {
                    "document_type": ai_type,
                    "confidence": 0.90
                }
        except Exception as e:
            logger.warning(f"AI classification fallback failed: {e}")

        return {
            "document_type": candidate,
            "confidence": round(candidate_confidence, 2)
        }
