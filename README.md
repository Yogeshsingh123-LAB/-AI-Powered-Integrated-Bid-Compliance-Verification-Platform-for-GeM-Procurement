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
│   │   ├── ai_engine/      # OCR pipeline (PyMuPDF, Tesseract, OpenCV) + Forgery Detector (editing signatures, font clutter, mod-dates, patch overlays)
│   │   ├── mock_apis/      # Mock Govt Portals (GSTIN, PAN, Udyam, Blacklist) + GSTN v2.0 HMAC-SHA256 & UIDAI e-KYC Sandbox Gateways
│   │   ├── scoring/        # Compliance Scorer, Procurement Fraud & Multi-Bidder Collusion Detector, Risk Classifier
│   │   └── api/            # API Router endpoints (Auth, Users, Documents, Analysis)
│   │   
│   ├── scenarios/          # Pre-built realistic PDF bid scenarios for testing
│   ├── tests/              # Pytest automated test suites (OCR, APIs, Scoring, Forgery & Fraud)
│   ├── requirements.txt
│   └── .env.example
├── docs/                   # Integration blueprints (GEM_GSTN_SANDBOX_INTEGRATION.md)
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

1. **AI PDF Forgery & Structural Tampering Engine**: Inspects document structure, text layers, and embedded metadata (`backend/app/ai_engine/forgery_detector.py`). Detects unauthorized editing software fingerprints (Photoshop, Canva, GIMP, MS Word, Foxit, Sejda, etc.), creation vs. modification timestamp discrepancies indicating post-issuance tampering, font diversity clutter (>6 fonts per single-page certificate), image patch overlays on text layers, and verifies PKCS#7 digital signature markers.
2. **CBIC GSTN v2.0 & UIDAI Sandbox Gateways**: Production gateway implementation (`backend/app/mock_apis/sandbox_gateway.py`) for CBIC GSTN Public API v2.0 featuring HMAC-SHA256 request signing (`X-HMAC-Signature`), OAuth2 token rotation with cached tokens, 2.0-second timeout retry, and seamless fail-soft fallback to structured offline mock schemas. Includes UIDAI e-KYC Sandbox integration enforcing strict Aadhaar privacy via salted SHA-256 hash checks.
3. **Cross-Bidder Collusion & Procurement Fraud Engine**: Cross-references database extractions across competing bids in a tender (`backend/app/scoring/fraud_detector.py`) to detect multi-bidder GSTIN/PAN/Udyam reuse under distinct bidder aliases (identifying shell company networks and bid rigging). Computes fuzzy Levenshtein similarity ratios between submitted bidder titles, GSTIN legal names, and Income Tax PAN records (<60% legal name mismatch penalty, <50% submitted vs registered name mismatch).
4. **Weighted Compliance Scoring Engine**: Evaluates bid compliance across 3 tiers (Presence: 30%, Verification: 40%, Registry Integrity: 30%), applies strict penalties for missing primary mandatory IDs (GSTIN/PAN, -15 pts), deducts points for blacklisted status (-30 pts, sets integrity to 0), subtracts AI forgery tampering penalties (up to 30 pts) and multi-bidder collusion/fraud penalties (up to 30 pts), classifying bids into `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL` risk tiers.
5. **BidVerify Role-Based Access Controls (RBAC)**: Enforces clear separation between Bidder / Supplier Terminal and Administrative Audit Console. Enforces JWT token validation and role clearance checks to prevent unauthorized access to buyer audit queues or admin portal controls.
6. **Brand Identity & Logo Visual Polish**: Integrates high-definition transparent logo assets (`/public/logo.png`, `logo_icon.png`) with ambient drop-shadow styling across the Login card overlay, Bidder Portal header, and Administrative Console.
7. **Cryptographic Audit Chain**: Uses SHA-256 block hashing to chain every audit log entry to the previous record (`blockchain_hash`), establishing an immutable audit log.
8. **Unified REST API Endpoint `/api/analyze` & Codebase Cleanup**: Single POST endpoint processing uploaded bid documents (PDF, JPG, PNG up to 10 MB) through text parsing, AI forgery inspection, registry verification lookups, cross-bidder fraud detection, scoring, and cryptographic audit logging. Codebase is clean, optimized, and fully covered by 43 automated pytest integration tests.

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
- **Average Document Processing Time**: `< 5 seconds` (including PDF text parsing, image preprocessing/binarization, fallback image OCR, forgery ELA/metadata analysis, and registry verification).
- **Registry Lookup Latency**: `< 2.0 seconds` per API query (with zero-latency offline fallback mechanism).

---

## 7. Platform Capability Overview

| Aspect | Implementation Summary |
|--------|------------------------|
| **Architecture** | Monorepo structure, FastAPI backend engine, React Vite SPA frontend |
| **Branding & Logos** | Transparent logo assets (`/logo.png`), studio-grade dark/light themes, ambient drop shadows |
| **Platform Access Controls** | Role-Based Access Control (RBAC) separating Bidder Portal & Administrative Audit Console |
| **AI/ML & Forgery Engine** | PyMuPDF + Tesseract OCR + OpenCV preprocessors + spaCy NER + Forgery Detector (editing tool fingerprints, mod-date mismatch, font clutter, patch overlays, digital sigs) |
| **Sandbox & Mock Gateways** | CBIC GSTN v2.0 HMAC Sandbox Gateway, UIDAI e-KYC Sandbox, PAN, Udyam MSME, Blacklist REST lookups with zero-downtime offline fallback |
| **Fraud & Collusion Engine** | Database cross-matching of GSTIN/PAN reuse across competing bidders, fuzzy Levenshtein name alignment, shell company network detection |
| **Scoring Engine** | 3-tier weighted scoring (30% Presence, 40% Verification, 30% Integrity), mandatory ID missing penalties, forgery & collusion risk deductions |
| **Security & Auditing** | SHA-256 cryptographic hash chain audit logs, timing attack defense, 10MB limit, regex filename sanitization |
| **Codebase & Testing** | Optimized clean codebase, 43 automated pytest test suites passing, 4 runner scripts, 5 sample PDF scenario documents |


