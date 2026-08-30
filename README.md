# AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement

**Problem Statement ID**: 26100  
This repository contains both the **Frontend** and **Backend** components of the GeM Bid Compliance Platform structured as a clean mono-repo.

---

## 1. Directory Structure

```
SIH_TRAILS/
├── frontend/               # React / Vite SPA Client
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── backend/                # FastAPI / SQLAlchemy 2.x API Server
│   ├── app/
│   │   ├── ai_engine/      # OCR pipeline (PyMuPDF, Tesseract, OpenCV) + Forgery Detector (ELA, metadata, font consistency)
│   │   ├── mock_apis/      # Mock Govt Portals (GSTIN, PAN, Udyam, Blacklist) + GSTN/UIDAI Sandbox Gateway v2.0
│   │   ├── scoring/        # Compliance Scorer, Fraud & Collusion Detector, Risk Classifier
│   │   └── api/            # API Router endpoints (Auth, Users, Documents, Analysis)
│   │   
│   ├── scenarios/          # Pre-built realistic PDF bid scenarios for testing
│   ├── tests/              # Pytest automated test suites (OCR, APIs, Scoring, Forgery & Fraud)
│   ├── requirements.txt
│   └── .env.example
├── docs/                   # Integration blueprints (GSTN Sandbox, Architecture guides)
├── brain.md                # System Architecture & API Blueprint
└── README.md               # Main instructions (this file)
```

---

## 2. Operation Instructions

### A. Frontend (React Client)
To launch the frontend interface:
1. Navigate to the `frontend/` folder:
   ```bash
   cd frontend
   ```
2. Install client dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The client will be running at: http://localhost:5173/ or http://localhost:5174/*

---

### B. Backend (FastAPI Server)
To launch the backend API:
1. Navigate to the `backend/` folder:
   ```bash
   cd backend
   ```
2. Create and activate a python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Generate the mock database JSON records (uses Faker to generate 50+ linked registry records):
   ```bash
   python generate_mock_data.py
   ```
5. Generate sample scenario PDFs:
   ```bash
   python generate_sample_pdfs.py
   ```
6. Start the FastAPI application via Uvicorn:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *The Swagger interactive API docs will be at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)*

---

## 3. GeMmy Chat Assistant

The frontend includes a floating **Ask GeMmy** assistant on the login and dashboard screens. It answers questions about portal navigation, PDF/image uploads, GSTIN/PAN/Udyam checks, compliance scoring, risk levels, bid status, and the buyer audit workflow.

The assistant calls `POST /api/chat` on the FastAPI backend on port 8000 and works without an external service through its built-in platform knowledge base. To enable Groq-generated answers, copy `backend/.env.example` to `backend/.env` and configure:

```env
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-20b
GROQ_WEB_SEARCH_ENABLED=true
GROQ_WEB_MODEL=groq/compound-mini
```

The frontend reads `VITE_API_URL` and defaults to `http://127.0.0.1:8000` for chat requests.

---

## 4. Core Verification & Security Architecture

1. **AI OCR & Forgery Detection Engine**: Uses Tesseract OCR + OpenCV image preprocessing (binarization, Otsu thresholding, blurring) to parse scanned PDFs/images alongside PyMuPDF for digital PDFs (50-page max safety check). Performs Error Level Analysis (ELA), font consistency inspection, and PDF metadata tampering detection to flag forged documents. Extracts identifiers (GSTIN, PAN, Udyam) and organization names via regex and spaCy NER.
2. **CBIC GSTN & UIDAI Sandbox Gateways**: Production-ready gateway implementation (`backend/app/mock_apis/sandbox_gateway.py`) supporting CBIC GSTN Public API v2.0 with HMAC-SHA256 request signing, OAuth2 token rotation, rate-limiting retry, and seamless fallback to verified mock schemas if external sandbox endpoints are offline.
3. **Collusion & Fraud Risk Engine**: Analyzes bid submissions across bidders for duplicate document hashes, shared bank account details / PAN / contact numbers, shell company risk indicators, and pattern-based bidder collusion.
4. **Compliance Scoring**: Assesses weighted scores (Presence: 30%, Verification: 40%, Integrity/Risk: 30%), verifies registry name alignments, deducts points for missing primary mandatory IDs (GSTIN/PAN) and detected document forgery/fraud risks, flags risk categories, and provides actionable recommendation alerts.
5. **Cryptographic Audit Chain**: Uses SHA-256 block hashing to chain every audit log entry to the previous record (`blockchain_hash`), establishing an immutable audit log.
6. **Endpoint `/api/analyze`**: Exposes a POST endpoint taking uploaded bid documents (PDF, JPG, PNG up to 10 MB), processing through OCR, forgery analysis, and registry verification, writing SHA-256 audit entries, and returning a unified JSON compliance report.

---

## 5. Running Verification Test Suites

Automated verification test suites are located in the `backend/` directory. Run them with the virtual environment active:

```bash
# Run pytest test suite
pytest
```

Individual test scripts:
1. **AI OCR Pipeline Test**: `python run_ai_engine_test.py`
2. **Mock APIs Registry Test**: `python run_mock_apis_test.py`
3. **Scoring & Risk Engine Test**: `python run_scoring_test.py`
4. **Forgery & Fraud Detection Test**: `pytest backend/tests/test_forgery_and_fraud.py`
5. **Final Analysis REST Integration Test**: `python run_final_integration_test.py`

---

## 6. Performance Metrics
- **Average Document Processing Time**: `< 5 seconds` (including PDF text parsing, image preprocessing/binarization, fallback image OCR, forgery ELA analysis, and mock registry queries).
- **Registry Lookup Latency**: `< 2.0 seconds` per API query (with zero-latency local fallback mechanism).

---

## 7. Platform Capability Overview

| Aspect | Implementation Summary |
|--------|------------------------|
| **Architecture** | Monorepo structure, FastAPI backend, React Vite SPA frontend |
| **AI/ML Engine** | PyMuPDF + Tesseract OCR + OpenCV preprocessors + spaCy NER + Forgery Detector (ELA & metadata checks) |
| **Sandbox & Mock APIs** | CBIC GSTN v2.0 HMAC Sandbox Gateway, UIDAI e-KYC Sandbox, PAN, Udyam MSME, Blacklist REST lookups |
| **Fraud & Collusion** | Cross-bidder hash matching, shared banking/PAN collusion flags, shell company risk detection |
| **Scoring Engine** | 3-tier weighted scoring, mandatory ID penalty, name token alignment, forgery risk deductions |
| **Security & Auditing** | SHA-256 blockchain hash chain audit logs, timing attack defense, 10MB limit |
| **Testing** | Automated pytest test suites, 4 runner scripts, 5 sample PDF scenarios |
