import logging
from typing import Dict, Any, Optional
from app.ai_engine import PDFHandler

logger = logging.getLogger(__name__)

class SmartPDFHandler:
    """
    Wrapper for backward compatibility, delegating to app.ai_engine.PDFHandler.
    """
    def __init__(self, poppler_path: Optional[str] = None):
        self.handler = PDFHandler(poppler_path=poppler_path)

    def preprocess_image_for_ocr(self, pil_image):
        from app.ai_engine import OCRParser
        return OCRParser.preprocess_image(pil_image)

    def is_page_scanned(self, text: str, word_threshold: int = 5) -> bool:
        return PDFHandler.is_page_scanned(text, word_threshold)

    def extract_text_from_pdf(self, pdf_path: str, use_preprocessing: bool = True) -> Dict[str, Any]:
        try:
            with open(pdf_path, "rb") as f:
                pdf_bytes = f.read()
            res = self.handler.extract_text(pdf_bytes, pdf_path=pdf_path)
            # Re-format slightly to match original expected return output
            return {
                "success": res["success"],
                "text": res["text"],
                "pages": [{"page_number": i + 1, "text": p_text} for i, p_text in enumerate(res["text"].split("\n"))] if res["success"] else [],
                "error": res["error"]
            }
        except Exception as e:
            return {
                "success": False,
                "text": "",
                "pages": [],
                "error": f"Failed to open/read pdf file: {str(e)}"
            }

if __name__ == "__main__":
    print("SmartPDFHandler class wrapper compiled successfully.")
