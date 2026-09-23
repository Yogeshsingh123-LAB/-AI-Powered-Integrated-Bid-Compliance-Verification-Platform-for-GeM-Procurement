import logging
from typing import Dict, Any
from PIL import Image

# NOTE: app.ai_engine pulls in heavy dependencies (PyMuPDF / OpenCV / tesseract).
# Import it lazily inside the methods so that API cold starts (Vercel) and
# non-OCR code paths (login, tenders, auth) do not pay the import cost.
logger = logging.getLogger(__name__)


def _ocr_parser():
    from app.ai_engine import OCRParser
    return OCRParser


def _pdf_handler():
    from app.ai_engine import PDFHandler
    return PDFHandler


class OCRService:
    @staticmethod
    def preprocess_image_for_ocr(pil_image: Image.Image) -> Image.Image:
        """Applies OpenCV preprocessing to clean up scanned images for higher OCR accuracy."""
        return _ocr_parser().preprocess_image(pil_image)

    @classmethod
    def extract_text_from_image(cls, image_bytes: bytes) -> Dict[str, Any]:
        """Perform OCR on image bytes (JPG, JPEG, PNG)."""
        return _ocr_parser().extract_text_from_image(image_bytes)

    @classmethod
    def extract_text_from_pdf(cls, pdf_bytes: bytes) -> Dict[str, Any]:
        """Extract text from PDF using PDFHandler. Automatically falls back to OCR if digital text is missing."""
        handler = _pdf_handler()()
        return handler.extract_text(pdf_bytes)

    @classmethod
    def extract_text_with_ocr(cls, file_bytes: bytes, mime_type: str) -> Dict[str, Any]:
        """Dispatch text extraction based on MIME type."""
        if mime_type == "application/pdf":
            return cls.extract_text_from_pdf(file_bytes)
        elif mime_type in {"image/jpeg", "image/jpg", "image/png", "image/tiff", "image/bmp"}:
            return cls.extract_text_from_image(file_bytes)
        else:
            return {
                "success": False,
                "text": "",
                "ocr_used": False,
                "ocr_engine": "none",
                "ocr_confidence": 0.0,
                "page_count": 0,
                "error": f"Unsupported MIME type: {mime_type}"
            }
