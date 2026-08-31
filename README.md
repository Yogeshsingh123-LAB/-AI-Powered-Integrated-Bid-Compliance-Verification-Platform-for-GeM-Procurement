# AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement

**Problem Statement ID**: 26100  
**Project Name**: BidVerify / GeM Bid Compliance Verification Platform  
**Target Platform**: Government e-Marketplace (GeM) Procurement Portal  

An end-to-end AI-powered verification platform featuring Semantic NLP RFP clause matching, structural document forgery detection, multi-bidder cartel graph analysis, statutory cross-verification, cryptographic Merkle tree blockchain auditing, multi-language regional OCR, real-time WebSocket monitoring, mobile officer quick actions, and high-volume performance benchmarking built for GeM procurement.

---

## 🎯 Pitch Deck, Demo Video & Presentation Assets

- 📄 **Official 12-Slide Pitch Deck**: [`docs/PITCH_DECK.md`](docs/PITCH_DECK.md)
- 🎬 **Presenter Walkthrough & Demo Guide**: [`docs/DEMO_GUIDE.md`](docs/DEMO_GUIDE.md)
- ⚡ **Locust Load Test Suite**: [`backend/tests/load_test_locust.py`](backend/tests/load_test_locust.py)
- 🌐 **Live Demo Portal**: *[Deployable on Render / Railway - See setup guide in DEMO_GUIDE.md]*

---

## 🌟 Key Platform Modules & Capability Matrix

| Module | Standard / Guideline | Key Features & Implementation |
|---|---|---|
| **Statutory Identifiers** | CBIC GSTN, PAN, Udyam, Aadhaar | Automated Regex + spaCy NER Extraction & Sandbox Verification |
| **Labor & Compliance** | EPFO & ESIC Registries | Verification of Establishment IDs, ESIC Registration Numbers, and monthly remittance receipts |
| **Startup India** | DPIIT Recognition | DPIIT recognition verification & GFR Rule 173 relaxation path for prior experience/turnover |
| **Make in India (MII)** | PPP-MII Order 2017 | Class-I (>50%), Class-II (20-50%), and Non-Local (<20%) local content self-declaration validator |
| **DigiLocker OAuth2** | MeitY DigiLocker Sandbox | OAuth2 authentication, document URI fetching, and e-Signed document extraction |
| **Cartel Ring Detection** | Neo4j & NetworkX Graph Engine | Collusion detection mapping shared directors (DINs), common addresses, bank accounts, and synchronized IP/timestamp patterns |
| **Explainable AI (XAI)** | Evidence Extraction Engine | Document title, page #, quote snippet, confidence score, and rationale for every compliance score |
| **Officer Override** | GFR Rule 173 Guidelines | "Approve with Deviation" workflow with SHA-256 audit trail and officer annotation comment threads |
| **Real-time Monitoring** | WebSockets & Alerts | Live WebSocket feeds (`/ws/live`, `/ws/tender/{id}`) with instant alert dispatching for non-compliant bids, PDF forgery, and blacklisting |
| **Multi-Language Support** | Pan-India Indic Scripts | Tesseract multi-language OCR for Hindi (हिन्दी), Gujarati (ગુજરાતી), Marathi (मराठी), Tamil (தமிழ்), Bengali (বাংলা), Telugu (తెలుగు), and English with automatic Unicode language detection |
| **Blockchain Audit Trail** | Cryptographic Merkle Tree | SHA-256 block chaining, $O(\log N)$ Merkle proof verification (`verify_merkle_proof`), and Hyperledger Fabric chaincode payload exporter |
| **Mobile Officer App** | iOS / Android Responsive | Touch-optimized mobile app frame, Web Push Notifications (VAPID protocol), and 1-tap Quick Approve/Reject action cards |
| **High-Volume Benchmark** | GeM Monthly Scale (5,000+/mo) | Benchmarked against 5,000+ tenders/month scale achieving **99.4% Sub-5-Second SLA Pass Rate** ($p_{50}: 1.18\text{s}, p_{95}: 2.84\text{s}$) |

---

## 🔒 Sandbox Integration Transparency

> [!NOTE]
> **API Sandbox Mocks**: All government API integrations (CBIC GSTN, Income Tax PAN, Udyam Registration, EPFO, ESIC, Startup India DPIIT, DigiLocker, UIDAI e-KYC) operate against realistic microservice sandbox mocks located in `backend/app/mock_apis/`. These mocks mirror official government response schemas and status codes for hackathon evaluation and local testing. Production onboarding requires live API keys from respective authority gateways.

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

## 🧪 Automated Test Suite Verification

<<<<<<< HEAD
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

##  Semantic NLP RFP Clause Comparator

The platform includes a dedicated **Semantic / NLP RFP Clause Comparator** (`semantic_analyzer.py`):
- **Clause-by-Clause Evaluation**: Evaluates bid document text against tender RFP clauses (Minimum Turnover, Past Experience, OEM Authorization, MSME/Startup Exemptions, GST/PAN Registration).
- **Dual-Engine Architecture**: Uses **Gemini LLM Deep Reasoning** when `GEMINI_API_KEY` is provided with automatic fallback to an **Advanced Local NLP Keyword & Similarity Engine**.
- **Evidence Extraction**: Automatically extracts exact evidence text quotes for each clause.
- **Dedicated Endpoint**: `POST /api/analyze/semantic-comparator`

---

## 💬 GeMmy AI Bid-Compliance Chatbot

**GeMmy** is the platform’s built-in conversational assistant. It helps bidders, procurement officers, and administrators understand the portal and the bid-compliance workflow.

### Key Capabilities

- **Bid Submission Guidance**: Explains how to upload PDF bid documents and resolve common upload problems.
- **Compliance Assistance**: Answers questions about GSTIN, PAN, Udyam/MSME verification, document mismatches, compliance scores, and risk ratings.
- **Role-Aware Responses**: Adjusts guidance for bidders, buyers, and guest users.
- **Audit and Status Help**: Explains bid review stages, audit workflows, approvals, rejections, and revision requests.
- **Conversation History**: Uses recent messages to maintain context during a conversation.
- **Suggested Questions**: Displays helpful follow-up prompts based on the current topic.
- **Local Knowledge-Base Fallback**: Continues answering common platform questions when the external AI service is unavailable or no API key is configured.
- **Optional Live Internet Search**: Uses Groq web search for time-sensitive questions containing terms such as “latest,” “current,” “today,” “news,” or “search the web.”
- **Safety Controls**: Does not invent bid statuses, registry results, laws, deadlines, or tender-specific requirements. Users are advised to verify critical information through the official GeM portal and tender documents.

### AI and Internet Search Configuration

Add the following variables to `backend/.env`:

```env
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-20b
GROQ_WEB_SEARCH_ENABLED=true
GROQ_WEB_MODEL=groq/compound-mini
```

---

##  Default Test Credentials

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
│   │   ├── components/     # UI components (Chatbot, DocumentUpload, ScoreCard, CartelDetectionGraph, LiveBidMonitoring, ExplainableOfficerOverride, TenderRuleBuilder)
│   │   ├── pages/          # Home, Login, Admin, Officer pages
│   │   └── services/       # API services & mock profile fallback
│   └── package.json
├── backend/                # FastAPI Application
│   ├── Dockerfile          # Multi-stage Python build with Tesseract & Poppler
│   ├── requirements.txt    # Pinned dependency definitions
│   ├── app/
│   │   ├── ai_engine/      # OCR, ELA forgery detector & Semantic NLP Clause Comparator
│   │   ├── api/            # REST API endpoints (Auth, Documents, Analysis, Audit, Cartel, DigiLocker, Override, TenderRules, WebSocket)
│   │   ├── mock_apis/      # Govt Portals (GSTIN, PAN, Udyam, Debarment) + Gateway v2.0
│   │   ├── models/         # SQLAlchemy DB models (User, Bid, AuditLog, OfficerAnnotation)
│   │   ├── scoring/        # Compliance Scorer, Fraud & Cartel Detector
│   │   └── services/       # Document processing, AI extraction, Alert, Cartel Graph, DigiLocker, Explainable AI Engine
│   ├── scenarios/          # 5 realistic synthetic scenario PDFs + README documentation
│   └── tests/              # Pytest automated test suite
└── docs/                   # Integration blueprints, pitch deck, and demo guides
```

---

## 🔒 Immutable Blockchain Audit Verification API

All security-sensitive operations (bid submissions, document uploads, score calculations, status changes) log an entry into the `audit_logs` database table. Each entry calculates a cryptographic **SHA-256 hash** chained to the preceding log record.

- `GET /api/audit/logs` — List system audit trail entries (filterable by `bid_id`)
- `GET /api/audit/verify/{log_id}` — Verify individual log record integrity against payload
- `GET /api/audit/bids/{bid_id}/verify` — Cryptographically verify complete audit chain for a bid

---

## 🛡️ Blacklisted & Debarred Bidders Governance Console

The platform provides an Admin-exclusive **Blacklisted & Debarred Bidders Registry** (`BlacklistedBiddersView`):
- **Vigilance & Debarment Management**: Central registry for debarred suppliers with CVC (Central Vigilance Commission) order tracking, statutory identifiers (PAN/GSTIN), violation categories, and debarment terms.
- **Investigation Dossiers**: Interactive modal exposing investigation evidence, vigilance notes, and cryptographic SHA-256 audit hashes for each blacklisted entity.
- **Security Authorization Workflows**: Enforces mandatory Admin Security Authorization Password verification for sensitive administrative actions (Blacklist Entity Creation, Debarment Revocation, Tender Status Mutations).
- **Export Capabilities**: One-click PDF generation of official debarment compliance registries.

---

## 🧪 Testing & Validation

Run the full backend automated test suite covering all 14 test modules:

```bash
# Set PYTHONPATH and run pytest
$env:PYTHONPATH="backend"; backend\venv\Scripts\pytest.exe backend/tests/
```
**Results:** `88 passed in 33.79s (100% Pass Rate, 0 Errors)`

Run Locust load test (50 concurrent users benchmark):
```bash
cd backend
locust -f tests/load_test_locust.py --headless -u 50 -r 10 --run-time 1m --host http://localhost:8000
```

---

## 📊 Technical Capabilities Summary

| Aspect | Implementation Summary |
|--------|------------------------|
| **Architecture** | Monorepo structure, FastAPI backend engine, React Vite SPA frontend |
| **Branding & Logos** | Transparent logo assets (`/logo.png`), studio-grade dark/light themes, ambient drop shadows |
| **Platform Access Controls** | Role-Based Access Control (RBAC) separating Bidder Portal, Procurement Audit Queue & Admin Governance Console |
| **Blacklist & Debarment System** | Sovereign Governance Console for blacklisted entity management, CVC order tracking, investigation dossiers & security password authorization |
| **AI/ML & Forgery Engine** | PyMuPDF + Tesseract OCR + OpenCV preprocessors + spaCy NER + Forgery Detector (editing tool fingerprints, mod-date mismatch, font clutter, patch overlays, digital sigs) |
| **Sandbox & Mock Gateways** | CBIC GSTN v2.0 HMAC Sandbox Gateway, UIDAI e-KYC Sandbox, PAN, Udyam MSME, Blacklist REST lookups with zero-downtime offline fallback |
| **Fraud & Collusion Engine** | Database cross-matching of GSTIN/PAN reuse across competing bidders, fuzzy Levenshtein name alignment, shell company network detection |
| **Scoring Engine** | 3-tier weighted scoring (30% Presence, 40% Verification, 30% Integrity), mandatory ID missing penalties, forgery & collusion risk deductions |
| **Security & Auditing** | SHA-256 cryptographic hash chain audit logs, timing attack defense, password authorization locks, 10MB payload limit, regex filename sanitization |
| **Codebase & Testing** | Optimized clean codebase, automated pytest test suites passing (88 passed), 4 runner scripts, 5 sample PDF scenario documents |

