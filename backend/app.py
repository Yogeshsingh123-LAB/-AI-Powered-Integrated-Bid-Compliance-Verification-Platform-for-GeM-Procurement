import os
import logging
import sys
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

# Import our pipeline modules
from app.services.pdf_handler import SmartPDFHandler
from app.services.regex_extractor import RegexExtractor
from app.services.mock_verifier import MockVerifier
from app.services.scoring_engine import ScoringEngine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}, allow_headers=["Content-Type"])

# Configure temporary upload folder inside project
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'temp_uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Limit file size to 16MB
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

def allowed_file(filename: str) -> bool:
    """Helper to verify if the uploaded file is a PDF."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() == 'pdf'

@app.route('/health', methods=['GET'])
def health_check():
    """Simple API health check endpoint."""
    return jsonify({
        "status": "healthy",
        "message": "AI-Powered Integrated Bid Compliance Verification API is operational."
    }), 200

@app.route('/api/analyze', methods=['POST'])
def analyze_pdf():
    """
    Main API endpoint: Takes a PDF file upload, extracts text (including OCR if scanned),
    extracts identifiers (GSTIN, PAN, Udyam), verifies them against mock registries,
    runs the scoring engine, and returns a comprehensive JSON compliance report.
    """
    logger.info("Received request on /api/analyze")
    
    # 1. Validate File Presence
    if 'file' not in request.files:
        logger.warning("No file part in request.")
        return jsonify({
            "success": False,
            "error": "No file uploaded. Please upload a PDF file under the form-data key 'file'."
        }), 400
        
    file = request.files['file']
    
    if file.filename == '':
        logger.warning("Empty filename uploaded.")
        return jsonify({
            "success": False,
            "error": "Empty filename. Please select a valid PDF file."
        }), 400
        
    if not allowed_file(file.filename):
        logger.warning(f"Invalid file extension: {file.filename}")
        return jsonify({
            "success": False,
            "error": "Unsupported file format. Only PDF files (.pdf) are allowed."
        }), 400

    # 2. Save file temporarily
    temp_path = None
    try:
        filename = secure_filename(file.filename)
        with tempfile.NamedTemporaryFile(
            prefix="gem-analysis-", suffix=".pdf", dir=app.config['UPLOAD_FOLDER'], delete=False
        ) as temp_file:
            temp_path = temp_file.name
        file.save(temp_path)
        logger.info(f"Uploaded file saved temporarily to: {temp_path}")
        
        # 3. Step 1: Text Extraction (Smart PDF Handler)
        # Note: If poppler is in custom path, specify here:
        # handler = SmartPDFHandler(poppler_path=r"C:\path\to\poppler")
        handler = SmartPDFHandler()
        extraction_result = handler.extract_text_from_pdf(temp_path, use_preprocessing=True)
        
        if not extraction_result["success"]:
            raise ValueError(f"Text extraction failed: {extraction_result['error']}")
            
        full_text = extraction_result["text"]
        
        # Build page-by-page metadata summary for API
        pages_summary = []
        for p in extraction_result["pages"]:
            pages_summary.append({
                "page_number": p["page_number"],
                "method": p["method"],
                "characters": len(p["text"]),
                "error": p.get("error")
            })

        # 4. Step 2: Regular Expression Identifier Extraction
        extracted_ids = RegexExtractor.extract_identifiers(full_text)
        
        # 5. Step 3: Mock Database Verification
        verification_details = MockVerifier.verify_all_identifiers(extracted_ids)
        
        # 6. Step 4: Scoring & Risk Recommendation Engine
        compliance_report = ScoringEngine.calculate_compliance_score(verification_details)
        
        # 7. Construct Final Response Payload
        response_payload = {
            "success": True,
            "filename": filename,
            "text_extraction": {
                "total_pages": len(pages_summary),
                "pages_detail": pages_summary
            },
            "extracted_identifiers": extracted_ids,
            "verification_details": verification_details,
            "compliance_report": compliance_report
        }
        
        logger.info(f"Successfully processed compliance check for file: {filename}")
        return jsonify(response_payload), 200

    except Exception as e:
        logger.error(f"Error processing upload request: {str(e)}", exc_info=True)
        return jsonify({
            "success": False,
            "error": f"Internal server error: {str(e)}"
        }), 500
        
    finally:
        # 8. Clean up uploaded temporary file
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
                logger.info(f"Cleaned up temporary file: {temp_path}")
            except Exception as cleanup_err:
                logger.error(f"Failed to remove temp file {temp_path}: {str(cleanup_err)}")

if __name__ == "__main__":
    # In production, run this via gunicorn or uwsgi
    # For local developer testing:
    logger.info("Starting Flask server on port 5000...")
    app.run(host="0.0.0.0", port=5000, debug=True)
