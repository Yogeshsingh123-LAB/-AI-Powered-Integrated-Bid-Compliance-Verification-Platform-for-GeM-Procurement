# BidVerify Platform Walkthrough & Demo Guide

**Problem Statement ID**: SIH26100  
**Project Name**: BidVerify / GeM Integrated Bid Compliance Verification Platform  

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
