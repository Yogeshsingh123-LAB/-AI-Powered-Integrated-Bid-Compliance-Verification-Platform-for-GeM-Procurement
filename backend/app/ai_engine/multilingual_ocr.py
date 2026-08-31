import re
import logging
from typing import Dict, Any, Optional, Tuple
from PIL import Image

logger = logging.getLogger(__name__)

# Import base OCRParser
try:
    import pytesseract
    from app.ai_engine.ocr_parser import OCRParser
    HAS_PYTESSERACT = True
except ImportError:
    HAS_PYTESSERACT = False

class MultilingualOCREngine:
    """
    Extends OCR processing to support pan-India regional languages:
    Hindi (hin), Gujarati (guj), Marathi (mar), Tamil (tam), Bengali (ben), Telugu (tel), English (eng).
    Includes automatic Unicode script identification and fallback parsing.
    """

    SUPPORTED_LANGUAGES = {
        "hin": {"name": "Hindi", "native": "हिन्दी", "script": "Devanagari"},
        "guj": {"name": "Gujarati", "native": "ગુજરાતી", "script": "Gujarati"},
        "mar": {"name": "Marathi", "native": "मराठी", "script": "Devanagari"},
        "tam": {"name": "Tamil", "native": "தமிழ்", "script": "Tamil"},
        "ben": {"name": "Bengali", "native": "বাংলা", "script": "Bengali"},
        "tel": {"name": "Telugu", "native": "తెలుగు", "script": "Telugu"},
        "eng": {"name": "English", "native": "English", "script": "Latin"}
    }

    @classmethod
    def detect_script_from_text(cls, text: str) -> str:
        """Determines the primary language code based on Unicode character ranges."""
        if not text:
            return "eng"

        devanagari_count = len(re.findall(r'[\u0900-\u097F]', text))
        gujarati_count = len(re.findall(r'[\u0A80-\u0AFF]', text))
        bengali_count = len(re.findall(r'[\u0980-\u09FF]', text))
        tamil_count = len(re.findall(r'[\u0B80-\u0BFF]', text))
        telugu_count = len(re.findall(r'[\u0C00-\u0C7F]', text))

        counts = {
            "hin": devanagari_count,
            "guj": gujarati_count,
            "ben": bengali_count,
            "tam": tamil_count,
            "tel": telugu_count
        }

        max_lang = max(counts, key=counts.get)
        if counts[max_lang] > 3:
            return max_lang

        return "eng"

    @classmethod
    def perform_multilingual_ocr(
        cls,
        pil_image: Optional[Image.Image] = None,
        target_lang: str = "hin+guj+eng",
        raw_text_input: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes multi-language OCR on PIL image or processes raw regional text input.
        """
        extracted_text = ""
        used_engine = "Fallback Text Processor"

        if pil_image and HAS_PYTESSERACT:
            try:
                # Preprocess image
                processed_img = OCRParser.preprocess_image(pil_image)
                # Tesseract multi-language invocation
                extracted_text = pytesseract.image_to_string(processed_img, lang=target_lang)
                used_engine = f"Tesseract Multi-Language ({target_lang})"
            except Exception as e:
                logger.warning(f"MultilingualOCREngine: Tesseract multi-lang error ({e}). Using OCR fallback.")
                extracted_text = raw_text_input or ""
        else:
            extracted_text = raw_text_input or ""

        detected_lang = cls.detect_script_from_text(extracted_text)
        lang_info = cls.SUPPORTED_LANGUAGES.get(detected_lang, cls.SUPPORTED_LANGUAGES["eng"])

        return {
            "extracted_text": extracted_text,
            "detected_language": detected_lang,
            "language_name": lang_info["name"],
            "native_label": lang_info["native"],
            "script": lang_info["script"],
            "ocr_engine": used_engine
        }
