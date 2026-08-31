# GeM BidVerify: Live Demo Guide & Presenter Walkthrough

This guide provides a step-by-step walkthrough script, demo scenarios, and hosting setup instructions for live presentations during Smart India Hackathon (SIH) and evaluation panels.

---

## 1. Quick Local & Docker Setup

### Option A: One-Command Docker Setup
```bash
docker-compose up --build -d
```
- Access Frontend UI: `http://localhost:3000`
- Access Backend API Docs (Swagger): `http://localhost:8000/docs`

### Option B: Local Python & Node Execution
```bash
# Terminal 1: Backend
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

---

## 2. Presenter Walkthrough Script (2-Minute Demo Flow)

### Step 1: Login & Dashboard Overview (0:00 - 0:30)
1. Navigate to `http://localhost:3000` (or your live deployed link).
2. Log in as a **Procurement Officer** (`officer@gem.gov.in` / `officer123`).
3. Point out key dashboard metrics:
   - Total Bids Processed
   - Average Compliance Score
   - High-Risk Vendor Flags & AI Forgery Alerts

### Step 2: Upload Bid Document & Real-Time Processing (0:30 - 1:00)
1. Click **"Analyze New Bid"**.
2. Upload a sample tender PDF (e.g., `scenarios/sample_bid_compliant.pdf`).
3. Highlight instant extraction:
   - Statutory Identifiers: GSTIN, PAN, Udyam Registration.
   - Enterprise Category: Manufacturer vs. Trader classification.
   - Document Certificates: Turnover, Experience, OEM Authorization, Land Border Declaration, EMD Proof.

### Step 3: Detailed Compliance Score & RFP Clause Comparator (1:00 - 1:30)
1. Scroll to the **Compliance Score Report**:
   - Show score breakdown: Document Completeness (30), DB Verification (40), Registry Integrity (30).
   - Point out real GeM rule deductions (e.g., if a Trader claims MSME EMD exemption or Land-Border declaration is missing).
2. Switch to the **Semantic RFP Comparator Tab**:
   - Demonstrate clause-by-clause matching (`RFP-01` to `RFP-08`).
   - Click on `RFP-06 (Land Border Rule 144(xi))` to show extracted text evidence snippets.

### Step 4: Cryptographic Audit Log Verification (1:30 - 2:00)
1. Navigate to **"Audit Trail"**.
2. Point out the SHA-256 hash-chain ledger.
3. Click **"Verify Cryptographic Integrity"** — show green checkmark confirming zero tampering in historical logs.
4. Conclude: *"BidVerify transforms manual document checks into an instant, verifiable, and fraud-resistant verification system."*

---

## 3. Demo Scenarios & Sample Files

| Scenario Name | Description | Key Feature Shown |
|---|---|---|
| `sample_bid_compliant.pdf` | Fully compliant bid document | 100/100 score, Low Risk, all RFP clauses MET |
| `sample_bid_forged.pdf` | PDF with modified metadata/splicing | AI ELA Forgery Detection Alert (-30 pts) |
| `sample_bid_collusion.pdf` | Bids sharing matching IP/bank metadata | Multi-Bidder Fraud Risk Alert |
| `sample_bid_trader_msme.pdf` | Trader claiming MSME EMD exemption | Domain Rule Deduction: Trader Ineligible for MSE Exemption |

---

## 4. Deploying Live (Render / Railway Setup)

- **Backend (Render / Railway Web Service)**:
  - Build Command: `pip install -r backend/requirements.txt`
  - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
  - Environment Variables: `PORT=8000`, `GEMINI_API_KEY=<your_key>`
- **Frontend (Render / Vercel Static Site)**:
  - Build Command: `cd frontend && npm install && npm run build`
  - Output Directory: `frontend/dist`
  - Environment Variables: `VITE_API_BASE_URL=https://<your-backend-url>.onrender.com`
