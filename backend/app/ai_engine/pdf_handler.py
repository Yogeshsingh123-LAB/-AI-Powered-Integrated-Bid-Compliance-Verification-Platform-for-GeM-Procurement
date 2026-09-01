import os
import logging
from typing import Dict, Any, List, Optional
import fitz  # PyMuPDF
from .ocr_parser import OCRParser

logger = logging.getLogger(__name__)

class PDFHandler:
    def __init__(self, poppler_path: Optional[str] = None):
        self.poppler_path = poppler_path
        if os.name == 'nt' and not self.poppler_path:
            from shutil import which
            if which("pdftoppm") is None:
                logger.info("PDFHandler: pdftoppm not in PATH. Ensure poppler is installed or poppler_path is passed.")

    @staticmethod
    def is_page_scanned(text: str, word_threshold: int = 5) -> bool:
        """Determines if a page is scanned based on extracted word count."""
        if not text:
            return True
        words = text.strip().split()
        return len(words) < word_threshold

    def extract_text(self, pdf_bytes: bytes, pdf_path: Optional[str] = None) -> Dict[str, Any]:
        """
        Extract text from PDF.
        Attempts to read digital text using PyMuPDF and pdfplumber, 
        and falls back to rendering page as image and running OCR where needed.
        """
        try:
            # Open PDF stream using fitz (PyMuPDF)
            MAX_PDF_PAGES = 50
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            total_pages = len(doc)
            logger.info(f"PDFHandler: Opened PDF with PyMuPDF. Total pages: {total_pages}")
            
            if total_pages > MAX_PDF_PAGES:
                logger.warning(f"PDFHandler: PDF has {total_pages} pages, exceeding max limit of {MAX_PDF_PAGES}.")
                return {
                    "success": False,
                    "error": f"PDF exceeds maximum allowed page limit of {MAX_PDF_PAGES} pages.",
                    "raw_text": "",
                    "digital_text": "",
                    "ocr_text": "",
                    "ocr_used": False,
                    "average_ocr_confidence": 0.0,
                    "total_pages": total_pages,
                    "scanned_pages": 0
                }
            
            digital_text = ""
            ocr_text = ""
            ocr_used = False
            total_ocr_confidence = 0.0
            ocr_pages_count = 0
            
            for idx, page in enumerate(doc):
                page_text = page.get_text() or ""
                digital_text += page_text + "\n"
                
                if self.is_page_scanned(page_text):
                    ocr_used = True
                    try:
                        # Render page as PNG image at 300 DPI for high-accuracy OCR
                        pix = page.get_pixmap(dpi=300)
                        img_data = pix.tobytes("png")
                        
                        # Process OCR using OCRParser
                        ocr_res = OCRParser.extract_text_from_image(img_data)
                        if ocr_res["success"]:
                            ocr_text += ocr_res["text"] + "\n"
                            total_ocr_confidence += ocr_res.get("ocr_confidence", 0.85)
                            ocr_pages_count += 1
                        else:
                            ocr_text += page_text + "\n"
                    except Exception as page_err:
                        logger.error(f"PDFHandler: OCR page extraction failed for page {idx+1}: {page_err}")
                        ocr_text += page_text + "\n"
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
            logger.exception(f"PDFHandler: PDF text extraction failed: {e}")
            return {
                "success": False,
                "text": "",
                "ocr_used": False,
                "ocr_engine": "none",
                "ocr_confidence": 0.0,
                "page_count": 0,
                "error": f"PDF extraction failed: {str(e)}"
            }
