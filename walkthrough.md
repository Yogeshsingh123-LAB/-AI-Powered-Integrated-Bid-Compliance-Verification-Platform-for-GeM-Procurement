# Bid Zee Platform Walkthrough & Demo Guide

**Problem Statement ID**: SIH26100  
**Project Name**: Bid Zee / GeM Integrated Bid Compliance Verification Platform  

---

## 🎬 Step-by-Step Platform Walkthrough

### 1. Launching the Platform
Double-click `run_platform.bat` or run in PowerShell:
```powershell
.\run_platform.ps1
```
This boots up the FastAPI backend on `http://localhost:8000` and the React Vite frontend on `http://localhost:5173`.

---

### 2. Guided Tender Creation Wizard
1. Log in as a Procurement Officer.
2. Navigate to **Create Tender**.
3. Complete the 6-step guided wizard:
   - **Step 1**: Basic Tender Details & Submission Deadlines.
   - **Step 2**: Statutory Eligibility Selection (GST, PAN, Udyam, Income Tax, EPFO, ESIC, etc.).
   - **Step 3**: Required Document Upload Rules & Allowed File Types (`.pdf`, `.png`, `.jpg`).
   - **Step 4**: Verification Rule Toggles (OCR, Government API Lookup, Blacklist Checks).
   - **Step 5**: Configurable Scoring Weights & Risk Level Score Bands (`LOW`: 90-100, `MEDIUM`: 75-89, `HIGH`: 50-74, `CRITICAL`: 0-49).
   - **Step 6**: Review Summary Card & Publish Tender.

---

### 3. Bidder Application & Document Upload
1. Switch to a Bidder profile.
2. Browse active tenders and click **Apply**.
3. Upload statutory certificates (GST, PAN, Udyam, EPFO, ESIC, OEM Authorization).
4. Real-time document validation checks format, file size, and expiry dates before submission.

---

### 4. Verification Gateway & Evidence-First Verification
1. As Procurement Officer, view submitted bids for a tender.
2. Click **Run Verification** to execute OCR, AI document parsing, and Mock Verification Gateway lookups (`/api/verify/gst/{gstin}`, `/api/verify/pan/{pan}`, `/api/verify/udyam/{udyam_id}`, etc.).
3. View overall compliance score dial, risk classification (`MEDIUM`), and interactive requirement checklist (`✓ VERIFIED`, `⚠ NEEDS REVIEW`, `❌ MISSING/FAILED`).
4. Click any checklist item to open the **Evidence Modal**:
   - Displays *WHAT was checked*, *WHERE checked*, *Extracted vs Registry Data*, *RESULT*, and *Officer Action Steps*.

---

### 5. Clarification & Re-Verification Loop
1. Procurement Officer flags a requirement needing correction (e.g. OEM Authorization) and submits a clarification request.
2. Bidder receives in-app notification and uploads a replacement document.
3. System automatically re-runs OCR, API lookups, and scoring.
4. Score updates dynamically (e.g. 78/100 -> 94/100), risk changes (`MEDIUM` -> `LOW`), officer is notified, and full versioned audit trail is logged.

---

### 6. Advanced Integrity Features
- **Cartel Collusion Detection**: Open the Cartel Detection tab to inspect NetworkX/Neo4j graph visualization highlighting shared DINs, IP addresses, or bank accounts among bidders.
- **Merkle Tree Blockchain Audit**: Inspect the SHA-256 tamper-evident audit log verifying every step from submission to qualification.
- **Officer Override**: Override any AI suggestion with mandatory timestamped justification notes.
- **MyGeM AI Assistant**: Use the bottom-right assistant widget to ask compliance questions in English or Indic regional languages.

---

## 📄 Documentation & Roadmap References
- **Implementation Plan**: Details architecture and technical design in [`implementation_plan.md`](implementation_plan.md).
- **Mock APIs → Production Roadmap**: See the live endpoint swap-in roadmap table in [`README.md`](README.md#mock-apis--production-roadmap).

---

## 🧪 Quick Test Execution

### Backend Pytest Suite
```powershell
cd backend
.\venv\Scripts\python.exe -m pytest
```

### Frontend Build Check
```powershell
cd frontend
npm run build
```

---

# Walkthrough & Launch Guide — Bid Zee Platform

Bid Zee is an AI-powered integrated bid compliance verification platform designed for GeM government procurement.

The following implementation notes and test results were recorded on the incoming branch; they are historical reports, not verification of this merged revision.

## Accomplished Implementation Tasks

### 1. Comprehensive System Audit & Verification
- Validated all backend endpoints, SQLAlchemy relational models, JWT security middleware, and role-based permissions (`BIDDER`, `OFFICER`, `ADMIN`).
- Validated database schema connectivity against Neon PostgreSQL.

### 2. Dual Storage Engine Enhancement
- Refactored `StorageService` in [`storage_service.py`](backend/app/services/storage_service.py) to implement dual storage: uses Supabase Cloud Storage when credentials exist, and falls back to local filesystem storage (`storage/uploads`) automatically when unconfigured.

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

---

## 🔐 Admin Console & User Management Updates

- **Full Administrative User Profile Management**:
  - Update user name, email, department, and role (`Super Admin`, `Procurement Officer`, `Verification Officer`, `Auditor`, `Bidder`).
  - Account status lifecycle: `Active`, `Pending Approval`, `Suspended`, `Inactive`.
  - Quick **[ Grant Access ]** button on Pending account rows for instant officer onboarding.
  - Administrative password resets and secure user account deletion.
  - **Mandatory Admin Authorization Password**: All sensitive administrative actions require password re-verification (`admin_authorization_password`) to ensure account security.

---

## 🌐 Hybrid Verification Gateway & `data.gov.in` MCA21 Live Integration

- **Real MCA21 Master Data Lookup**:
  - Integrates directly with Government of India Open Data Platform (`data.gov.in`) MCA21 Company Master Data endpoint (~3.67M company records, GODL licensed).
  - Environment setting: `MCA_GATEWAY_MODE=live` and `DATA_GOV_IN_API_KEY`.
  - Automatic graceful fallback to local database when offline or API limit reached.
- **Simulated Adapters**:
  - GSTN, PAN, Udyam, EPFO, ESIC, DigiLocker, and Debarment adapters are configured with modular adapter interfaces ready for production endpoint swap (Sandbox.co.in / Setu).

