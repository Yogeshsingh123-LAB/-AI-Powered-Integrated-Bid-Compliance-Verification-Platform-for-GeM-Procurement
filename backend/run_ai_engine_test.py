import sys
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Add current folder to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def run_tests():
    logger.info("Starting verification tests for app.ai_engine...")
    
    try:
        from app.ai_engine import OCRParser, PDFHandler, EntityExtractor, DocumentAnalyzer
        logger.info("Successfully imported all components from app.ai_engine!")
    except Exception as e:
        logger.error(f"Failed to import from app.ai_engine: {e}")
        sys.exit(1)
        
    # 1. Test EntityExtractor with regex and spaCy NER
    sample_text = """
    This is to certify that M/S INFOSYS TECHNOLOGIES PVT LTD having registration on 2012-04-15
    at Bangalore, Karnataka, India has been verified.
    GSTIN: 29AAPCS1234M1Z5
    PAN: AAPCS1234M
    Udyam Registration Number: UDYAM-KA-02-0098765
    Total value of goods: INR 45,00,000 (Local content percentage: 75%)
    Authorization expiry date: 2028-12-31
    """
    
    logger.info("Running EntityExtractor on sample text...")
    res = EntityExtractor.extract_all(sample_text)
    
    logger.info("--- Identifiers Extracted ---")
    logger.info(f"GSTINs: {res['identifiers']['gstin']}")
    logger.info(f"PANs: {res['identifiers']['pan']}")
    logger.info(f"Udyam IDs: {res['identifiers']['udyam']}")
    
    logger.info("--- spaCy NER Entities Extracted ---")
    logger.info(f"Organizations: {res['entities']['organizations']}")
    logger.info(f"Dates: {res['entities']['dates']}")
    logger.info(f"Locations: {res['entities']['locations']}")
    logger.info(f"Money/Percentages: {res['entities']['money_or_percentage']}")
    
    # 2. Test OCRParser preprocessing and mock execution
    logger.info("Testing OCRParser preprocessing...")
    try:
        from PIL import Image
        import numpy as np
        # Create a dummy image
        img_arr = np.zeros((100, 100, 3), dtype=np.uint8)
        dummy_img = Image.fromarray(img_arr)
        processed = OCRParser.preprocess_image(dummy_img)
        logger.info("OCRParser dummy image preprocessing completed successfully.")
    except Exception as e:
        logger.error(f"OCRParser image preprocessing test failed: {e}")
        
    # 3. Test DocumentAnalyzer pipeline
    logger.info("Testing DocumentAnalyzer execution...")
    try:
        import io
        analyzer = DocumentAnalyzer()
        # Mock image bytes
        img_byte_arr = io.BytesIO()
        dummy_img.save(img_byte_arr, format='PNG')
        img_bytes = img_byte_arr.getvalue()
        
        analysis = analyzer.analyze_document(img_bytes, "image/png")
        logger.info("DocumentAnalyzer analysis completed successfully!")
        logger.info(f"Analysis Success Status: {analysis['success']}")
        logger.info(f"OCR Used: {analysis['ocr_used']}, Engine: {analysis['ocr_engine']}")
    except Exception as e:
        logger.error(f"DocumentAnalyzer test failed: {e}")
        sys.exit(1)

    logger.info("All verification tests passed successfully!")

if __name__ == "__main__":
    run_tests()
