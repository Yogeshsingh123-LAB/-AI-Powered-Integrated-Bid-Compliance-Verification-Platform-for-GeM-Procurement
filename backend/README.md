# GeM Bid Compliance API - Backend Foundation

This is the backend for the AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement.

## Technology Stack
- **Python 3.11+**
- **FastAPI**
- **PostgreSQL / Local SQLite Fallback**
- **SQLAlchemy 2.x**
- **Pydantic Settings**
- **JWT authentication**
- **python-multipart**
- **PyMuPDF & Tesseract OCR**

---

## Setup & Run Instructions

### 1. Create a Virtual Environment
Open your terminal, navigate to the `backend` directory, and run:
```bash
cd backend
python -m venv venv
```

### 2. Activate the Virtual Environment (Windows)
Run the activation script:
```powershell
.\venv\Scripts\activate
```

### 3. Install Dependencies
Install required python packages:
```bash
pip install -r requirements.txt
```

### 4. Database Setup
The backend automatically connects to PostgreSQL (`DATABASE_URL`). If PostgreSQL is unconfigured or unavailable, it automatically falls back to a local SQLite database (`bid_compliance.db`) with auto-created tables out-of-the-box.

### 5. Generate Mock Data & Sample Documents
Run data seeds and test document generators:
```bash
python generate_mock_data.py
python generate_sample_pdfs.py
```

### 6. Start the FastAPI Development Server
From the `backend` directory, launch Uvicorn:
```bash
uvicorn app.main:app --reload --port 8000
```
*The server will be running at: `http://127.0.0.1:8000`*

### 7. Interactive API Documentation
Open your browser to:
- **Interactive Docs (Swagger UI)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Alternative Docs (ReDoc)**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## Analysis API Contract

`POST /api/analyze` accepts a multipart form upload under the `file` key. Supported file types include PDF, JPG, JPEG, and PNG up to a **10 MB** size limit (`MAX_FILE_SIZE = 10MB`).

Successful responses include `text_extraction`, `extracted_identifiers`, `verification_details`, `compliance_report`, and audit tracking:
```json
{
  "success": true,
  "filename": "bid_document.pdf",
  "text_extraction": {"total_pages": 1, "pages_detail": []},
  "extracted_identifiers": {"gstin": [], "pan": [], "udyam": []},
  "verification_details": {"gstin": [], "pan": [], "udyam": []},
  "compliance_report": {
    "score": 85,
    "risk_level": "LOW",
    "breakdown": {},
    "deductions": [],
    "recommendations": []
  }
}
```

The compliance score evaluates `presence (30) + database verification (40) + registry integrity (30)`, clamped to 0-100. Deductions apply for missing primary mandatory procurement identifiers (GSTIN/PAN), status suspensions, or registry name mismatches. Blacklisted vendors are flagged as `HIGH` risk with a full integrity deduction.

---

## Security & Audit Features
- **Cryptographic Audit Trail**: Every security and compliance action writes a SHA-256 chain hash (`blockchain_hash`) linking to the previous audit log entry.
- **Constant-Time Verification**: Password verification includes side-channel timing attack defenses.
- **Filename Sanitization**: Uploaded files undergo regex sanitization (`re.sub(r'[^a-zA-Z0-9._-]', '_', ...)`) and payload size validation.
