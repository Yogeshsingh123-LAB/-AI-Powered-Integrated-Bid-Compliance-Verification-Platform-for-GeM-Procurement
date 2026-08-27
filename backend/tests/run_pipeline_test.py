import os
from pdf_handler import SmartPDFHandler
from regex_extractor import RegexExtractor

def test_pipeline():
    handler = SmartPDFHandler()
    
    print("\n" + "="*60)
    print("INTEGRATED PIPELINE TEST (PDF TEXT EXTRACTOR + REGEX EXTRACTOR)")
    print("="*60)
    
    # Files to test
    test_files = ["digital_test.pdf", "scanned_test.pdf"]
    
    for filename in test_files:
        if not os.path.exists(filename):
            print(f"\nError: {filename} does not exist. Run create_test_pdfs.py first.")
            continue
            
        print(f"\n[1] Processing PDF: {filename} ...")
        # Extract text
        result = handler.extract_text_from_pdf(filename)
        
        if not result["success"]:
            print(f"Extraction failed: {result['error']}")
            continue
            
        print(f"Extraction method: {', '.join([p['method'] for p in result['pages']])}")
        print(f"Extracted characters: {len(result['text'])}")
        
        print("\n[2] Running Regex Extractor on extracted text...")
        identifiers = RegexExtractor.extract_identifiers(result["text"])
        
        print("\nResults:")
        print(f"  - GSTIN(s): {identifiers['gstin']}")
        print(f"  - PAN(s):   {identifiers['pan']}")
        print(f"  - Udyam(s): {identifiers['udyam']}")
        print("-" * 60)

if __name__ == "__main__":
    test_pipeline()
