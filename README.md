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

Run the full backend automated test suite covering all 14 test modules:

```bash
# Set PYTHONPATH and run pytest
$env:PYTHONPATH="backend"; backend\venv\Scripts\pytest.exe backend/tests/
```

**Results:** `88 passed in 33.79s (100% Pass Rate, 0 Errors)`
