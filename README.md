# AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement

**Problem Statement ID**: 26100  
**Project Name**: BidVerify / GeM Bid Compliance Verification Platform  
**Target Platform**: Government e-Marketplace (GeM) Procurement Portal  

An end-to-end AI-powered verification, document forgery detection, statutory cross-verification, collusion detection, and immutable blockchain audit trail solution built for GeM procurement.

---

## 🚀 Quickstart: 1-Command Docker Setup

For instant evaluation, spin up PostgreSQL, the FastAPI Backend, and Nginx Static Frontend using **Docker Compose**:

```bash
# 1. Clone repository
git clone https://github.com/Yogeshsingh123-LAB/-AI-Powered-Integrated-Bid-Compliance-Verification-Platform-for-GeM-Procurement.git
cd gem-bid-compliance

# 2. Copy environment template
cp .env.example .env

# 3. Launch all services via Docker Compose
docker-compose up --build
```

- **Frontend Client**: [http://localhost:3000](http://localhost:3000)
- **Backend API Docs (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **PostgreSQL Database**: Port `5432` (`bid_compliance_db`)

---

## 🛠️ Local Development Setup

### A. Backend (FastAPI + Python 3.11)

1. Navigate to backend directory:
   ```bash
   cd backend
   ```
2. Create and activate Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows PowerShell:
   .\venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Generate mock database records & synthetic test scenarios:
   ```bash
   python generate_mock_data.py
   python generate_sample_pdfs.py
   ```
5. Launch FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *Swagger Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)*

---

### B. Frontend (React + Vite + Tailwind/Vanilla CSS)

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start Vite dev server:
   ```bash
   npm run dev
   ```
   *Frontend Client: [http://localhost:5173](http://localhost:5173)*

---

## 🔑 Default Test Credentials

| Role | Username / Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Bidder Entity** | `bidder@techgov.in` | `Bidder@123` | Submit bid documents, view score report & profile |
| **Procurement Officer** | `officer@gem.gov.in` | `Officer@123` | Evaluate bids, inspect forgery flags & collusion matrix |
| **Platform Administrator** | `admin@gem.gov.in` | `Admin@123` | Audit trail verification & system rule configuration |

---

## 📁 Directory Structure

```
gem-bid-compliance/
├── .env.example            # Environment variables template
├── docker-compose.yml      # Multi-container orchestration (DB + Backend + Frontend)
├── README.md               # Project documentation & setup instructions
├── brain.md                # System Architecture & Technical Blueprint
├── frontend/               # React SPA Client
│   ├── Dockerfile          # Nginx static deployment build
│   ├── src/
│   │   ├── components/     # UI components (Chatbot, DocumentUpload, ScoreCard)
│   │   ├── pages/          # Home, Login, Admin, Officer pages
│   │   └── services/       # API services & mock profile fallback
│   └── package.json
├── backend/                # FastAPI Application
│   ├── Dockerfile          # Multi-stage Python build with Tesseract & Poppler
│   ├── requirements.txt    # Pinned dependency definitions
│   ├── app/
│   │   ├── ai_engine/      # OCR, pdfplumber & ELA metadata forgery detector
│   │   ├── api/            # REST API endpoints (Auth, Documents, Analysis, Audit)
│   │   ├── mock_apis/      # Govt Portals (GSTIN, PAN, Udyam, Debarment) + Gateway v2.0
│   │   ├── models/         # SQLAlchemy DB models (User, Bid, AuditLog)
│   │   ├── scoring/        # Compliance Scorer, Fraud & Collusion Detector
│   │   └── services/       # Document processing & AI extraction service
│   ├── scenarios/          # 5 realistic synthetic scenario PDFs + README documentation
│   └── tests/              # Pytest automated test suite (43 passed tests)
└── docs/                   # Integration blueprints & API schemas
```

---

## 🔗 Immutable Blockchain Audit Verification API

All security-sensitive operations (bid submissions, document uploads, score calculations, status changes) log an entry into the `audit_logs` database table. Each entry calculates a cryptographic **SHA-256 hash** chained to the preceding log record.

- `GET /api/audit/logs` — List system audit trail entries (filterable by `bid_id`)
- `GET /api/audit/verify/{log_id}` — Verify individual log record integrity against payload
- `GET /api/audit/bids/{bid_id}/verify` — Cryptographically verify complete audit chain for a bid

---

## 🧪 Testing & Validation

Run backend unit and integration test suites:

```bash
cd backend
# Run full pytest suite (43 tests)
python -m pytest

# Run end-to-end final integration test pipeline
python run_final_integration_test.py
```
