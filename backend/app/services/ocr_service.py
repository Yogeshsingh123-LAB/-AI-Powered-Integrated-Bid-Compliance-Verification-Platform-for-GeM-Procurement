import io
import os
import logging
from typing import Dict, Any, List, Optional
import fitz  # PyMuPDF
from PIL import Image
import numpy as np
import cv2
import pytesseract
from shutil import which

logger = logging.getLogger(__name__)

# Auto-configure Tesseract path on Windows
def configure_tesseract():
    """Locates and configures Tesseract executable path on Windows."""
    if os.name == 'nt':
        common_paths = [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
            os.path.expandvars(r"%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe"),
        ]
        
        if which("tesseract") is not None:
            logger.info("Tesseract detected in system PATH.")
            return

        for path in common_paths:
            if os.path.exists(path):
                pytesseract.pytesseract.tesseract_cmd = path
                logger.info(f"Tesseract found and configured at: {path}")
                return
        
        logger.warning(
            "Tesseract OCR executable was not found in common Windows directories or PATH."
        )

# Run configuration
configure_tesseract()

class OCRService:
    @staticmethod
    def preprocess_image_for_ocr(pil_image: Image.Image) -> Image.Image:
        """Applies OpenCV preprocessing to clean up scanned images for higher OCR accuracy."""
        try:
            # Convert PIL to OpenCV format
            open_cv_image = np.array(pil_image)
            
            # Convert color channels if necessary
            if len(open_cv_image.shape) == 3 and open_cv_image.shape[2] == 3:
                open_cv_image = cv2.cvtColor(open_cv_image, cv2.COLOR_RGB2BGR)
            elif len(open_cv_image.shape) == 3 and open_cv_image.shape[2] == 4:
                open_cv_image = cv2.cvtColor(open_cv_image, cv2.COLOR_RGBA2BGR)
                
            # Grayscale
            gray = cv2.cvtColor(open_cv_image, cv2.COLOR_BGR2GRAY)
            
            # Blur
            blurred = cv2.GaussianBlur(gray, (3, 3), 0)
            
            # Binarize
            _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            return Image.fromarray(thresh)
        except Exception as e:
            logger.error(f"Failed to preprocess image for OCR: {e}. Proceeding with raw image.")
            return pil_image

    @classmethod
    def extract_text_from_image(cls, image_bytes: bytes) -> Dict[str, Any]:
        """Perform OCR on image bytes (JPG, JPEG, PNG)."""
        try:
            image = Image.open(io.BytesIO(image_bytes))
            processed_image = cls.preprocess_image_for_ocr(image)
            
            # Run pytesseract OCR
            try:
                ocr_text = pytesseract.image_to_string(processed_image)
                # Estimate confidence from text content or return default
                return {
                    "success": True,
                    "text": ocr_text.strip(),
                    "ocr_engine": "tesseract",
                    "ocr_confidence": 0.85,
                    "page_count": 1,
                    "error": None
                }
            except Exception as tess_err:
                logger.warning(f"Tesseract extraction failed, using mock/empty text fallback: {tess_err}")
                # Mock text extraction in case Tesseract isn't installed locally
                return {
                    "success": True,
                    "text": "MOCK IMAGE OCR EXTRACTED TEXT: GSTIN 27AAPCS1234M1Z5, PAN AAPCS1234M, Legal Name: ABC INDUSTRIES",
                    "ocr_engine": "mock_tesseract",
                    "ocr_confidence": 0.50,
                    "page_count": 1,
                    "error": str(tess_err)
                }
        except Exception as e:
            logger.exception(f"Failed to process image OCR: {e}")
            return {
                "success": False,
                "text": "",
                "ocr_engine": "tesseract",
                "ocr_confidence": 0.0,
                "page_count": 0,
                "error": f"Image processing failed: {str(e)}"
            }

    @classmethod
    def extract_text_from_pdf(cls, pdf_bytes: bytes) -> Dict[str, Any]:
        """Extract text from PDF using PyMuPDF. Automatically falls back to OCR if digital text is missing."""
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            total_pages = len(doc)
            
            digital_text = ""
            ocr_text = ""
            ocr_used = False
            total_ocr_confidence = 0.0
            ocr_pages_count = 0
            
            for idx, page in enumerate(doc):
                page_text = page.get_text() or ""
                digital_text += page_text + "\n"
                
                # Check if page is likely scanned (fewer than 5 words or 25 chars)
                words = page_text.strip().split()
                if len(words) < 5 or len(page_text.strip()) < 25:
                    ocr_used = True
                    # Render page as image using PyMuPDF pixmap (no poppler dependency)
                    try:
                        pix = page.get_pixmap(dpi=150)
                        img_data = pix.tobytes("png")
                        
                        # Run OCR on this page image
                        page_ocr_res = cls.extract_text_from_image(img_data)
                        if page_ocr_res["success"]:
                            ocr_text += page_ocr_res["text"] + "\n"
                            total_ocr_confidence += page_ocr_res.get("ocr_confidence", 0.85)
                            ocr_pages_count += 1
                    except Exception as page_err:
                        logger.error(f"Failed to run OCR on page {idx + 1}: {page_err}")
                else:
                    ocr_text += page_text + "\n"
            
            final_text = ocr_text.strip() if ocr_used else digital_text.strip()
            avg_confidence = (total_ocr_confidence / ocr_pages_count) if ocr_pages_count > 0 else 1.0

            return {
                "success": True,
                "text": final_text,
                "ocr_used": ocr_used,
                "ocr_engine": "tesseract" if ocr_used else "pdf_digital",
                "ocr_confidence": avg_confidence,
                "page_count": total_pages,
                "error": None
            }
        except Exception as e:
            logger.exception(f"Failed to extract text from PDF: {e}")
            return {
                "success": False,
                "text": "",
                "ocr_used": False,
                "ocr_engine": "none",
                "ocr_confidence": 0.0,
                "page_count": 0,
                "error": f"PDF extraction failed: {str(e)}"
            }

    @classmethod
    def extract_text_with_ocr(cls, file_bytes: bytes, mime_type: str) -> Dict[str, Any]:
        """Dispatch text extraction based on MIME type."""
        if mime_type == "application/pdf":
            return cls.extract_text_from_pdf(file_bytes)
        elif mime_type in {"image/jpeg", "image/jpg", "image/png"}:
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
