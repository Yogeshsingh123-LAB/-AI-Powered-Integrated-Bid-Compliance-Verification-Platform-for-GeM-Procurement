import os
import sys
from pdf_handler import SmartPDFHandler

def run_test():
    # Initialize the handler
    # Note: On Windows, if Poppler is not in your system PATH, you must specify the path here, e.g.:
    # handler = SmartPDFHandler(poppler_path=r"C:\path\to\poppler-xx\Library\bin")
    handler = SmartPDFHandler()
    
    print("\n" + "="*50)
    print("TESTING SMART PDF HANDLER")
    print("="*50)
    
    # 1. Test Digital PDF
    digital_pdf = "digital_test.pdf"
    if os.path.exists(digital_pdf):
        print(f"\n--- Testing Digital Extraction on: {digital_pdf} ---")
        result = handler.extract_text_from_pdf(digital_pdf)
        print(f"Success: {result['success']}")
        if result['success']:
            for page in result['pages']:
                print(f"Page {page['page_number']} Method: {page['method']}")
            print("\nExtracted Content:")
            print(result['text'].strip())
        else:
            print(f"Error: {result['error']}")
    else:
        print(f"\nError: {digital_pdf} does not exist. Run create_test_pdfs.py first.")
        
    # 2. Test Scanned PDF (OCR)
    scanned_pdf = "scanned_test.pdf"
    if os.path.exists(scanned_pdf):
        print(f"\n--- Testing OCR Extraction on: {scanned_pdf} ---")
        result = handler.extract_text_from_pdf(scanned_pdf, use_preprocessing=True)
        print(f"Success: {result['success']}")
        if result['success']:
            for page in result['pages']:
                print(f"Page {page['page_number']} Method: {page['method']}")
            print("\nExtracted Content:")
            print(result['text'].strip())
        else:
            print(f"Error: {result['error']}")
            print("\n[NOTE] If this failed, ensure Tesseract OCR is installed and Poppler is configured/added to path.")
    else:
        print(f"\nError: {scanned_pdf} does not exist. Run create_test_pdfs.py first.")

if __name__ == "__main__":
    run_test()
