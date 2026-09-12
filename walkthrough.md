# Walkthrough & Launch Guide — BidVerify Platform

BidVerify is an AI-powered integrated bid compliance verification platform designed for GeM government procurement.

## Accomplished Implementation Tasks

### 1. Comprehensive System Audit & Verification
- Validated all backend endpoints, SQLAlchemy relational models, JWT security middleware, and role-based permissions (`BIDDER`, `OFFICER`, `ADMIN`).
- Validated database schema connectivity against Neon PostgreSQL.

### 2. Dual Storage Engine Enhancement
- Refactored `StorageService` in [`storage_service.py`](file:///c:/Users/sandi/OneDrive/Desktop/SIH_TRAILS/backend/app/services/storage_service.py) to implement dual storage: uses Supabase Cloud Storage when credentials exist, and falls back to local filesystem storage (`storage/uploads`) automatically when unconfigured.

### 3. Verification Suite & Deployment Checks
- Verified backend Pytest suite: 32 tests passed out of 32.
- Verified frontend test suite: 20 tests passed out of 20.
- Verified Vite production build: built 1830 modules cleanly in 1.12s.
- Executed `check_deployment.py` and `check_storage_upload.py` with exit code 0.

### 4. End-to-End Test Scenario

```
Bidder (ABC Technologies)
    ↓
Select Tender (GEM/2026/001)
    ↓
Upload Statutory Documents (GST, PAN, Udyam, ITR, EPFO, ESIC, OEM Authorization)
    ↓
OCR / Document Extraction (PyMuPDF / Regex Parser)
    ↓
AI Verification & Mock Govt API Lookup (GSTN, PAN, Udyam, Debarment Registry)
    ↓
Cross-Document Matching Engine (Detect Name & Registration Mismatches)
    ↓
Deterministic Compliance Engine (Score: 78 / 100, Risk: MEDIUM)
    ↓
Procurement Officer Review (Identifies OEM Authorization Mismatch)
    ↓
Clarification Request Issued (Bidder notified in-app)
    ↓
Bidder Uploads Corrected OEM Certificate
    ↓
Re-Verification Engine (Score updates 78 -> 94, Risk -> LOW)
    ↓
Officer Final Decision ([ QUALIFY ])
    ↓
Immutable Audit Log (SHA-256 integrity hash recorded)
```

## Running the Platform

To start the platform locally:

1. **PowerShell Launcher**:
   ```powershell
   .\run_platform.ps1
   ```

2. **Manual Backend Launch**:
   ```cmd
   cd backend
   venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
   ```

3. **Manual Frontend Launch**:
   ```cmd
   cd frontend
   cmd /c npm run dev
   ```

Open browser at `http://localhost:5173`.
