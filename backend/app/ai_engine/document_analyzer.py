import logging
from typing import Dict, Any, Optional
from .ocr_parser import OCRParser
from .pdf_handler import PDFHandler
from .entity_extractor import EntityExtractor

logger = logging.getLogger(__name__)

class DocumentAnalyzer:
    def __init__(self, poppler_path: Optional[str] = None):
        self.pdf_handler = PDFHandler(poppler_path=poppler_path)

    def analyze_document(self, file_bytes: bytes, mime_type: str) -> Dict[str, Any]:
        """
        Runs the full AI OCR document analysis pipeline:
        1. Extract raw text based on MIME type (using PDFHandler or OCRParser).
        2. Perform entity and identifier extraction.
        3. Formulate structured results.
        """
        logger.info(f"DocumentAnalyzer: Starting analysis for MIME type: {mime_type}")
        
        # 1. Text Extraction
        if mime_type == "application/pdf":
            extract_res = self.pdf_handler.extract_text(file_bytes)
        elif mime_type in {"image/jpeg", "image/jpg", "image/png"}:
            extract_res = OCRParser.extract_text_from_image(file_bytes)
        else:
            extract_res = {
                "success": False,
                "text": "",
                "ocr_used": False,
                "ocr_engine": "none",
                "ocr_confidence": 0.0,
                "page_count": 0,
                "error": f"Unsupported MIME type: {mime_type}"
            }
            
        if not extract_res["success"]:
            logger.error(f"DocumentAnalyzer: Text extraction failed: {extract_res.get('error')}")
            return {
                "success": False,
                "text": "",
                "ocr_used": False,
                "ocr_engine": "none",
                "ocr_confidence": 0.0,
                "page_count": 0,
                "identifiers": {"gstin": [], "pan": [], "udyam": []},
                "entities": {"organizations": [], "dates": [], "locations": [], "money_or_percentage": []},
                "error": extract_res.get("error", "Unknown extraction error")
            }
            
        # 2. Entity and Identifier Extraction
        text = extract_res["text"]
        extracted_data = EntityExtractor.extract_all(text)
        
        return {
            "success": True,
            "text": text,
            "ocr_used": extract_res.get("ocr_used", mime_type != "application/pdf"),
            "ocr_engine": extract_res.get("ocr_engine", "tesseract"),
            "ocr_confidence": extract_res.get("ocr_confidence", 0.85),
            "page_count": extract_res.get("page_count", 1),
            "identifiers": extracted_data["identifiers"],
            "entities": extracted_data["entities"],
            "error": None
        }
