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
│   │   ├── ai_engine/      # AI OCR document parser pipeline (Tesseract + OpenCV + spaCy NER)
│   │   ├── mock_apis/      # Mock Government Portals (GSTIN, PAN, Udyam, Blacklist)
│   │   ├── scoring/        # Compliance Scorer, Risk Classifier, Recommendation Engine
│   │   └── api/            # API Router endpoints (Auth, Users, Documents, Analysis)
│   │   
│   ├── scenarios/          # Pre-built realistic PDF bid scenarios for testing
│   ├── requirements.txt
│   └── .env
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
5. Generate the 5 sample scenario PDFs:
   ```bash
   python generate_sample_pdfs.py
   ```
6. Start the FastAPI application:
   ```bash
   uvicorn app.main:app --reload
   ```
   *The Swagger interactive API docs will be at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)*

---

## 3. Core Verification Pipelines

1. **AI OCR Engine**: Uses Tesseract OCR + OpenCV image preprocessing (binarization, blurring) to parse scanned PDFs/images, alongside PyMuPDF for digital PDFs. Performs Named Entity Recognition (NER) via spaCy and regular expressions to extract identifiers (GSTIN, PAN, Udyam) and organization details.
2. **Mock Government APIs**: REST API endpoints simulating direct integrations with external GSTIN, PAN, Udyam MSME, and Blacklist registries. Supports REST calls with local JSON fallbacks if the servers are offline.
3. **Compliance Scoring**: Assesses weighted scores (Presence: 30%, Verification: 40%, Integrity/Risk: 30%), verifies registry name alignments (excluding corporate suffix tokens like "Pvt Ltd"), flags risk categories, and provides actionable recommendation alerts.
4. **Endpoint `/api/analyze`**: Exposes a POST endpoint that takes an uploaded bid file, processes it through OCR, executes verification requests, calculates scores, writes entries to audit trails, and returns a unified JSON compliance report.

---

## 4. Running Verification Test Suites

We have built automated verification scripts to validate the integrity of each component. Run them in the `backend/` directory with the virtual environment active:

1. **AI OCR Pipeline Test**:
   ```bash
   python run_ai_engine_test.py
   ```
2. **Mock APIs Registry Test**:
   ```bash
   python run_mock_apis_test.py
   ```
3. **Scoring & Risk Engine Test**:
   ```bash
   python run_scoring_test.py
   ```
4. **Final Analysis REST Integration Test**:
   ```bash
   python run_final_integration_test.py
   ```