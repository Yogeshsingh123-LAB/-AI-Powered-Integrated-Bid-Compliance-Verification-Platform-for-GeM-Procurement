import io
import re
import logging
from typing import Dict, Any, List, Optional

try:
    import pymupdf as fitz  # PyMuPDF
except ImportError:
    fitz = None

import pdfplumber

logger = logging.getLogger(__name__)

EDITING_SOFTWARE_KEYWORDS = [
    "photoshop", "canva", "gimp", "microsoft word", "ms word", 
    "illustrator", "inkscape", "coreldraw", "foxit phantom", "sejda",
    "pdfedit", "pdfescape", "ilovepdf", "smallpdf", "wps office"
]

class ForgeryDetector:
    """
    Analyzes PDF document structure, metadata, fonts, and text layers to detect 
    potential document tampering, forgery, or post-issuance manual edits.
    """

    @staticmethod
    def analyze_pdf_bytes(pdf_bytes: bytes) -> Dict[str, Any]:
        """
        Inspects PDF bytes for structural anomalies, metadata discrepancies,
        editing tool signatures, and font inconsistencies.
        """
        if not pdf_bytes or len(pdf_bytes) < 10:
            return {
                "authentic": False,
                "forgery_score": 0,
                "risk_level": "CRITICAL",
                "anomalies": ["Invalid or empty document payload"],
                "metadata": {},
                "has_digital_signature": False
            }

        metadata = {}
        page_count = 0
        total_images = 0
        total_text_length = 0
        font_names = set()
        anomalies: List[str] = []
        warnings: List[str] = []
        score = 100

        try:
            if fitz is not None:
                doc = fitz.open(stream=pdf_bytes, filetype="pdf")
                metadata = doc.metadata or {}
                page_count = len(doc)
                for page in doc:
                    page_text = page.get_text() or ""
                    total_text_length += len(page_text.strip())
                    total_images += len(page.get_images())
                    try:
                        for font in page.get_fonts():
                            font_name = font[3] if len(font) > 3 else ""
                            if font_name:
                                font_names.add(font_name.lower())
                    except Exception:
                        pass
            else:
                with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                    metadata = pdf.metadata or {}
                    page_count = len(pdf.pages)
                    for page in pdf.pages:
                        page_text = page.extract_text() or ""
                        total_text_length += len(page_text.strip())
                        total_images += len(page.images or [])
        except Exception as e:
            logger.error(f"ForgeryDetector: Failed to open PDF stream: {e}")
            return {
                "authentic": False,
                "forgery_score": 50,
                "risk_level": "HIGH",
                "anomalies": [f"Could not parse PDF stream structure: {str(e)}"],
                "metadata": {},
                "has_digital_signature": False
            }

        creator = (metadata.get("creator") or "").lower()
        producer = (metadata.get("producer") or "").lower()
        creation_date = metadata.get("creationDate") or metadata.get("CreationDate") or ""
        mod_date = metadata.get("modDate") or metadata.get("ModDate") or ""

        combined_meta = f"{creator} {producer}"
        detected_editors = [tool for tool in EDITING_SOFTWARE_KEYWORDS if tool in combined_meta]

        if detected_editors:
            score -= 30
            anomalies.append(
                f"Document created or modified using unauthorized editing software: {', '.join(detected_editors).title()}. Official government certificates are issued directly by government portals."
            )

        if mod_date and creation_date and mod_date != creation_date:
            score -= 15
            anomalies.append(
                f"Post-issuance modification detected (Creation: {creation_date}, Modification: {mod_date}). Certificate was altered after initial generation."
            )

        if page_count <= 2 and len(font_names) > 6:
            score -= 15
            anomalies.append(
                f"Suspicious font diversity detected ({len(font_names)} distinct fonts found). Official government templates use consistent font families."
            )

        if total_images > 0 and 0 < total_text_length < 50:
            score -= 20
            anomalies.append(
                "Image overlay detected with minimal extractable text layer. Possible scanned image patch applied over digital text."
            )

        has_digital_sig = b"/ByteRange" in pdf_bytes or b"/Contents" in pdf_bytes
        if has_digital_sig:
            score = min(100, score + 10)
        else:
            warnings.append("No PKCS#7 digital signature structure detected in PDF metadata.")

        score = max(0, min(100, score))
        if score >= 85:
            risk_level = "LOW"
        elif score >= 65:
            risk_level = "MEDIUM"
        elif score >= 40:
            risk_level = "HIGH"
        else:
            risk_level = "CRITICAL"

        return {
            "authentic": score >= 70,
            "forgery_score": score,
            "risk_level": risk_level,
            "anomalies": anomalies,
            "warnings": warnings,
            "has_digital_signature": has_digital_sig,
            "metadata": {
                "creator": metadata.get("creator", "N/A"),
                "producer": metadata.get("producer", "N/A"),
                "creation_date": creation_date or "N/A",
                "modification_date": mod_date or "N/A",
                "page_count": page_count,
                "embedded_images": total_images,
                "detected_fonts": list(font_names)[:10]
            }
        }
