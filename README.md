# AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement

**Problem Statement ID**: 26100  
**Project Name**: BidVerify / GeM Bid Compliance Verification Platform  
**Target Platform**: Government e-Marketplace (GeM) Procurement Portal  


An end-to-end AI-powered verification, Semantic NLP RFP clause comparator, document forgery detection, statutory cross verification, collusion detection, and immutable blockchain audit trail solution built for GeM procurement.

---

## 🎯 Pitch Deck, Demo Video & Presentation Assets

- 📄 **Official 12-Slide Pitch Deck**: [`docs/PITCH_DECK.md`](docs/PITCH_DECK.md)
- 🎬 **Presenter Walkthrough & Demo Guide**: [`docs/DEMO_GUIDE.md`](docs/DEMO_GUIDE.md)
- ⚡ **Locust Load Test Suite**: [`backend/tests/load_test_locust.py`](backend/tests/load_test_locust.py)
- 🌐 **Live Demo Portal**: *[Deployable on Render / Railway - See setup guide in DEMO_GUIDE.md]*

---

## 📑 GeM Real Tender Compliance Matrix & Domain Alignment

| GeM Tender Clause / Requirement | Rule / Standard | Platform AI Implementation |
|---|---|---|
| **Statutory Identifiers** | GSTIN, PAN, Udyam, Aadhaar | Automated Regex + spaCy NER Extraction & Sandbox Verification |
| **Land Border Country Restriction** | GFR Rule 144(xi) | RFP-06 Clause Matching + Mandatory Competent Authority Declaration Check |
| **MSME EMD Exemption** | GeM Procurement Guidelines | Category-Aware Filter: Valid for Manufacturers/Services, Excludes Traders |
| **Startup Exemption Path** | DPIIT Recognition | RFP-08 Dedicated Turnover & Prior Experience Relaxation Path |
| **EMD / PBG Guarantee** | Tender Security Deposit | RFP-07 Verification of Payment Proof, Demand Draft, or Exemption Certificate |
| **Entity Integrity** | Tax & Procurement Registries | Cross-Registry Name Alignment & Blacklist Status Verification |

---

## 🔒 Sandbox Integration Transparency

> [!NOTE]
> **API Sandbox Mocks**: All government API integrations (CBIC GSTN, Income Tax PAN, Udyam Registration, UIDAI e-KYC) operate against realistic microservice sandbox mocks located in `backend/app/mock_apis/`. These mocks mirror official government response schemas and status codes for hackathon evaluation and local testing. Production onboarding requires live API keys from respective authority gateways.

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

##  Local Development Setup

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

##  Directory Structure

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
│   │   ├── ai_engine/      # OCR, ELA forgery detector & Semantic NLP Clause Comparator
│   │   ├── api/            # REST API endpoints (Auth, Documents, Analysis, Audit)
│   │   ├── mock_apis/      # Govt Portals (GSTIN, PAN, Udyam, Debarment) + Gateway v2.0
│   │   ├── models/         # SQLAlchemy DB models (User, Bid, AuditLog)
│   │   ├── scoring/        # Compliance Scorer, Fraud & Collusion Detector
│   │   └── services/       # Document processing & AI extraction service
│   ├── scenarios/          # 5 realistic synthetic scenario PDFs + README documentation
│   └── tests/              # Pytest automated test suite (47 passed tests)
└── docs/                   # Integration blueprints & API schemas
```

---

##  Immutable Blockchain Audit Verification API

All security-sensitive operations (bid submissions, document uploads, score calculations, status changes) log an entry into the `audit_logs` database table. Each entry calculates a cryptographic **SHA-256 hash** chained to the preceding log record.

- `GET /api/audit/logs` — List system audit trail entries (filterable by `bid_id`)
- `GET /api/audit/verify/{log_id}` — Verify individual log record integrity against payload
- `GET /api/audit/bids/{bid_id}/verify` — Cryptographically verify complete audit chain for a bid

---

## 🧪 Testing & Validation

Run backend unit, integration, and performance load test suites:

```bash
cd backend

# 1. Run full pytest suite (47 tests passed)
python -m pytest

# 2. Run end-to-end final integration test pipeline
python run_final_integration_test.py

# 3. Run Locust load test (50 concurrent users benchmark)
locust -f tests/load_test_locust.py --headless -u 50 -r 10 --run-time 1m --host http://localhost:8000
```

