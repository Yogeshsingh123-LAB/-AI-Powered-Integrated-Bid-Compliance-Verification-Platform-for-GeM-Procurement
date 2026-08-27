import os
import logging
import sys
from typing import Dict, Any, List, Optional
import cv2
import numpy as np
from PIL import Image
import pdfplumber
from pdf2image import convert_from_path
import pytesseract

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Auto-configure Tesseract path on Windows
def configure_tesseract():
    """Locates and configures Tesseract executable path on Windows."""
    if os.name == 'nt':
        # List of common installation locations for Tesseract on Windows
        common_paths = [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
            os.path.expandvars(r"%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe"),
        ]
        
        # Check if tesseract is already in PATH
        from shutil import which
        if which("tesseract") is not None:
            logger.info("Tesseract detected in system PATH.")
            return

        for path in common_paths:
            if os.path.exists(path):
                pytesseract.pytesseract.tesseract_cmd = path
                logger.info(f"Tesseract found and configured at: {path}")
                return
        
        logger.warning(
            "Tesseract OCR executable was not found in common Windows directories or PATH. "
            "OCR for scanned PDFs may fail unless Tesseract is installed and added to PATH."
        )

# Run configuration
configure_tesseract()

class SmartPDFHandler:
    """
    A robust PDF processing class that extracts text from both digitally created 
    (text-based) and scanned PDFs (using OCR).
    """

    def __init__(self, poppler_path: Optional[str] = None):
        """
        Initializes the SmartPDFHandler.
        
        Args:
            poppler_path (str, optional): The absolute path to the Poppler 'bin' directory.
                                         Required on Windows if Poppler is not in the system PATH.
        """
        self.poppler_path = poppler_path
        if os.name == 'nt' and not self.poppler_path:
            # Let's search for any common local folders or check if it's in path
            from shutil import which
            if which("pdftoppm") is None:
                logger.info(
                    "Poppler not detected in system PATH. For scanned PDFs (OCR), "
                    "ensure you pass 'poppler_path' to SmartPDFHandler."
                )

    def preprocess_image_for_ocr(self, pil_image: Image.Image) -> Image.Image:
        """
        Applies OpenCV preprocessing to clean up scanned page images for higher OCR accuracy.
        Steps: Convert to Grayscale -> Otsu Thresholding (Binarization) to separate text from background.
        
        Args:
            pil_image (PIL.Image.Image): Raw page image.
            
        Returns:
            PIL.Image.Image: Preprocessed binary image.
        """
        try:
            # 1. Convert PIL Image to OpenCV (numpy array) format
            open_cv_image = np.array(pil_image)
            
            # Convert RGB to BGR (OpenCV standard) if color
            if len(open_cv_image.shape) == 3 and open_cv_image.shape[2] == 3:
                open_cv_image = cv2.cvtColor(open_cv_image, cv2.COLOR_RGB2BGR)
            elif len(open_cv_image.shape) == 3 and open_cv_image.shape[2] == 4:
                open_cv_image = cv2.cvtColor(open_cv_image, cv2.COLOR_RGBA2BGR)
                
            # 2. Convert to Grayscale
            gray = cv2.cvtColor(open_cv_image, cv2.COLOR_BGR2GRAY)
            
            # 3. Apply Gaussian Blur to reduce noise before thresholding
            blurred = cv2.GaussianBlur(gray, (3, 3), 0)
            
            # 4. Apply Otsu's Thresholding to binarize (convert to absolute black & white)
            _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # Convert back to PIL Image
            preprocessed_pil = Image.fromarray(thresh)
            logger.info("Image preprocessing completed (Grayscale + Blur + Otsu Binarization).")
            return preprocessed_pil
            
        except Exception as e:
            logger.error(f"Failed to preprocess image for OCR: {str(e)}. Proceeding with raw image.")
            return pil_image

    def is_page_scanned(self, text: str, word_threshold: int = 5) -> bool:
        """
        Heuristic to determine if a page is scanned (requires OCR) or digital.
        If extracted text contains fewer words than the threshold, we classify it as scanned.
        
        Args:
            text (str): The raw text extracted using pdfplumber.
            word_threshold (int): Minimum number of words expected on a digital page.
            
        Returns:
            bool: True if page is likely scanned, False otherwise.
        """
        if not text:
            return True
        
        # Count words (sequences of non-space characters)
        words = text.split()
        return len(words) < word_threshold

    def extract_text_from_pdf(self, pdf_path: str, use_preprocessing: bool = True) -> Dict[str, Any]:
        """
        Extracts text from a PDF, automatically choosing between digital text extraction 
        and OCR on a page-by-page basis.
        
        Args:
            pdf_path (str): Path to the input PDF file.
            use_preprocessing (bool): Whether to apply OpenCV preprocessing on scanned pages.
            
        Returns:
            Dict[str, Any]: A dictionary containing:
                - "success": (bool) True if extraction completed.
                - "text": (str) Full extracted text combined from all pages.
                - "pages": (List[Dict]) Page-by-page breakdown (page_number, method used, and text).
                - "error": (str) Error message if failed.
        """
        logger.info(f"Starting text extraction from: {pdf_path}")
        
        if not os.path.exists(pdf_path):
            return {
                "success": False,
                "text": "",
                "pages": [],
                "error": f"File not found: {pdf_path}"
            }
            
        result = {
            "success": False,
            "text": "",
            "pages": [],
            "error": None
        }
        
        try:
            # Step 1: Open the PDF with pdfplumber to read metadata & check digital pages
            extracted_pages_data = []
            
            with pdfplumber.open(pdf_path) as pdf:
                total_pages = len(pdf.pages)
                logger.info(f"PDF opened successfully. Total pages: {total_pages}")
                
                for idx, page in enumerate(pdf.pages):
                    page_num = idx + 1
                    raw_text = page.extract_text() or ""
                    
                    if not self.is_page_scanned(raw_text):
                        logger.info(f"Page {page_num}/{total_pages}: Digital text detected.")
                        extracted_pages_data.append({
                            "page_number": page_num,
                            "method": "digital",
                            "text": raw_text
                        })
                    else:
                        logger.info(f"Page {page_num}/{total_pages}: Scanned page or empty text detected. Triggering OCR...")
                        
                        # Use pdf2image to convert ONLY this specific page to an image
                        try:
                            # convert_from_path can take first_page and last_page parameters to save memory/time
                            images = convert_from_path(
                                pdf_path,
                                first_page=page_num,
                                last_page=page_num,
                                poppler_path=self.poppler_path
                            )
                            
                            if not images:
                                raise ValueError(f"Failed to render Page {page_num} as image.")
                                
                            page_image = images[0]
                            
                            # Optional preprocessing with OpenCV
                            if use_preprocessing:
                                page_image = self.preprocess_image_for_ocr(page_image)
                                
                            # Perform OCR using pytesseract
                            ocr_text = pytesseract.image_to_string(page_image)
                            extracted_pages_data.append({
                                "page_number": page_num,
                                "method": "ocr",
                                "text": ocr_text
                            })
                            logger.info(f"Page {page_num}/{total_pages}: OCR completed successfully.")
                            
                        except Exception as ocr_err:
                            logger.error(f"OCR failed for Page {page_num}: {str(ocr_err)}")
                            extracted_pages_data.append({
                                "page_number": page_num,
                                "method": "failed",
                                "text": "",
                                "error": str(ocr_err)
                            })
            
            # Combine text from all pages
            full_text = "\n\n--- PAGE BREAK ---\n\n".join([p["text"] for p in extracted_pages_data])
            
            result["success"] = True
            result["text"] = full_text
            result["pages"] = extracted_pages_data
            
        except Exception as e:
            error_msg = f"Failed to process PDF: {str(e)}"
            logger.error(error_msg)
            result["error"] = error_msg
            
        return result

# Simple standalone execution
if __name__ == "__main__":
    print("SmartPDFHandler class imported and compiled successfully.")
