# Project Brain: GeM Bid Compliance Verification Platform

This document serves as the central brain, architecture guide, and design repository for the **AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement** (Problem Statement ID: 26100).

---

## 1. System Overview & Objectives
The goal of this platform is to automate compliance checking for bids submitted on the Government e-Marketplace (GeM). By replacing slow, manual document inspections with AI OCR parsing, Semantic NLP RFP clause matching, and verification against official government registry APIs, the platform prevents bid rigging, simplifies verification, and guarantees transparent auditing.

---

## 2. Platform Architecture

```mermaid
graph TD
    A[React/Vite Frontend] -- HTTP / JSON + JWT Bearer --> B[FastAPI Backend Engine]
    B -- SQLAlchemy 2.x --> C[(PostgreSQL / Local SQLite)]
    B -- External Integration --> E[Govt API Gateways & CBIC GSTN v2.0 Sandbox]
    B -- OCR & Forgery Engine --> F[AI Parser & ELA Forgery Detector]
    B -- Semantic NLP Engine --> G[Semantic RFP Clause Comparator]
    B -- Fraud Engine --> H[Cross-Bidder Collusion & Risk Detector]
    B -- Blockchain Audit --> I[SHA-256 Tamper-Evident Chain & Audit API]
```

### Containerized Infrastructure (Docker Orchestration)
- **`db` Service**: PostgreSQL 15 container with persistent volume storage (`postgres_data`).
- **`backend` Service**: Python 3.11 container with Tesseract OCR engine, Poppler PDF rendering tools, FastAPI API server on port `8000`.
- **`frontend` Service**: Multi-stage Node 20 build + Nginx static web server on port `3000` (mapped to container port `80`).

### Frontend (User Interface)
- **Tech Stack**: React 18, Vite, Custom Vanilla CSS, Lucide Icons.
- **Port Alignment**: Frontend connects to FastAPI backend on port `8000` (`VITE_API_URL` defaults to `http://127.0.0.1:8000`).
- **Role-Based Portals**:
  - **Procurement Officer / Buyer**: Master Audit Queue, bid details inspection, compliance audit reports, logs console, and compliance sign-off actions.
  - **Admin**: User credentials management, API gateways connectivity toggles, and compliance rules weight tuning.
  - **Bidder / Supplier**: Secure document upload terminal, bid status milestones tracker, and corporate profiles.

### Backend (Core Engine)
- **Tech Stack**: Python 3.11+, FastAPI, SQLAlchemy 2.x (ORM), Alembic (Migrations), SQLite/PostgreSQL.
- **AI & NLP Suite**:
  - `SemanticRFPComparator`: Clause-by-clause NLP & Gemini LLM evaluator (`MET`, `PARTIALLY_MET`, `NOT_MET`).
  - `ForgeryDetector`: Error Level Analysis (ELA), font consistency, and metadata modification detector.
  - `ProcurementFraudDetector`: Multi-bidder GSTIN/PAN identifier reuse & collusion detector.
- **Security & Integrity**:
  - Stateless JWT-based session tokens and password strength verification.
  - Constant-time password verification defense against timing side-channel attacks.
  - Cryptographic SHA-256 blockchain hash chain (`blockchain_hash`) for tamper-evident audit logging.
  - Upload payload size limits (10 MB max) and regex filename sanitization.
  - Self-healing database schema migrations for SQLite fallback instances.
- **CORS Configuration**: Restricts origins to trusted development origins (`http://localhost:5173`, `http://localhost:5174`, `http://localhost:3000`).

---

## 3. Database Schema Blueprint
The SQLAlchemy 2.x structure incorporates the following core tables:

### Users Table
- `id` (UUID, Primary Key)
- `full_name` (String)
- `email` (String, Unique, Indexed)
- `phone` (String, Optional)
- `password_hash` (String)
- `role` (Enum: `BIDDER`, `OFFICER`, `ADMIN`)
- `is_active` (Boolean)
- `created_at` (DateTime)
- `updated_at` (DateTime)

### Tenders Table
- `id` (String, Primary Key) - *e.g., GEM/2026/001*
- `title` (String)
- `budget_limit` (Numeric)
- `status` (String)
- `created_at` (DateTime)

### Requirements Table
- `id` (UUID, Primary Key)
- `tender_id` (String, ForeignKey -> Tenders)
- `code` (String)
- `description` (Text)
- `is_mandatory` (Boolean)

### Bids Table
- `id` (UUID, Primary Key)
- `tender_id` (String, ForeignKey -> Tenders)
- `bidder_id` (UUID, ForeignKey -> Users)
- `status` (String)
- `created_at` (DateTime)

### Documents Table
- `id` (UUID, Primary Key)
- `bid_id` (UUID, ForeignKey -> Bids)
- `requirement_id` (UUID, ForeignKey -> Requirements)
- `document_type` (String)
- `original_filename` (String)
- `storage_path` (String)
- `mime_type` (String)
- `file_size` (Integer)
- `file_hash` (String)
- `document_status` (String)
- `uploaded_by` (UUID, ForeignKey -> Users)
- `created_at` (DateTime)
- `updated_at` (DateTime)

### Audit Logs Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Optional, ForeignKey -> Users)
- `action` (String, e.g., "DOCUMENT_UPLOADED")
- `entity_type` (String, e.g., "Document")
- `entity_id` (UUID, Optional)
- `bid_id` (UUID, Optional, ForeignKey -> Bids)
- `old_value` (Text, Optional)
- `new_value` (Text, Optional)
- `ip_address` (String, Optional)
- `blockchain_hash` (String(64), Cryptographic SHA-256 chain hash linking to prior record)
- `created_at` (DateTime)

---

## 4. API Endpoints Map

| Method | Endpoint | Description | Auth Required | Role Restrictions |
|--------|----------|-------------|---------------|-------------------|
| `GET` | `/` | Root running message | No | None |
| `GET` | `/health` | Server health status | No | None |
| `POST` | `/api/auth/register` | Register a new Bidder account | No | None (Forces BIDDER) |
| `POST` | `/api/auth/login` | Login and obtain JWT token | No | None |
| `GET` | `/api/auth/me` | Retrieve authenticated profile | Yes | None |
| `POST` | `/api/auth/change-password` | Update current user's password | Yes | None |
| `POST` | `/api/auth/logout` | Revoke session (Client-side token removal) | Yes | None |
| `POST` | `/api/auth/seed` | Seed developer mock data | No | None |
| `PATCH` | `/api/users/profile` | Update current user's profile metadata | Yes | None |
| `GET` | `/api/admin/users` | List all registered users | Yes | `ADMIN` |
| `PATCH` | `/api/admin/users/{user_id}/status` | Activate/deactivate user account | Yes | `ADMIN` |
| `POST` | `/api/analyze` | Main PDF/image compliance analysis endpoint | No | None |
| `POST` | `/api/analyze/semantic-comparator` | Evaluate custom RFP clauses against bid text | No | None |
| `POST` | `/api/documents/upload` | Upload compliance document for a bid | Yes | `BIDDER` |
| `GET` | `/api/documents/bid/{bid_id}` | List all uploaded documents for a bid | Yes | `BIDDER` (Owner), `OFFICER`, `ADMIN` |
| `GET` | `/api/documents/{doc_id}/download` | Generate temporary signed download URL | Yes | `BIDDER` (Owner), `OFFICER`, `ADMIN` |
| `POST` | `/api/documents/{doc_id}/replace` | Replace an uploaded document | Yes | `BIDDER` (Owner) |
| `DELETE` | `/api/documents/{doc_id}` | Delete a document from bucket & DB | Yes | `BIDDER` (Owner) |
| `GET` | `/api/audit/logs` | Retrieve paginated immutable audit log entries | Yes | `OFFICER`, `ADMIN` |
| `GET` | `/api/audit/verify/{log_id}` | Cryptographically verify SHA-256 hash of an audit record | No | None |
| `GET` | `/api/audit/bids/{bid_id}/verify` | Cryptographically verify full audit chain for a bid | No | None |
| `POST` | `/api/chat` | Ask the GeMmy platform assistant | No | None |

---

## 5. Development Phases Status

- **Phase 1: AI OCR Integration** ✅ COMPLETE (PyMuPDF, OpenCV preprocessors, Tesseract OCR fallback, 50-page max safety check, spaCy NER tokenizers)
- **Phase 2: Government API Connectors** ✅ COMPLETE (GSTIN/PAN/Udyam/Blacklist gateways with REST lookups, format regex validation, and JSON fallbacks)
- **Phase 3: Compliance Scoring Algorithm** ✅ COMPLETE (Completeness/Verification/Integrity weighted scoring engine, mandatory ID missing penalties, and name token suffix matchers)
- **Phase 4: End-to-End Integration** ✅ COMPLETE (Main POST `/api/analyze` endpoint orchestration, upload handling, scoring report formatters, SHA-256 audit chain entries)
- **Phase 5: Testing & Validation** ✅ COMPLETE (Automated pytest test suites, runner scripts, scenario PDF mock documents)
- **Phase 6: Cryptographic Blockchain Audit Chain & Security Hardening** ✅ COMPLETE (SHA-256 hash chaining on AuditLog, timing attack mitigation on password verification, 10MB payload size limits, regex filename sanitization, port 8000 alignment).
- **Phase 7: Document Forgery Detection, Cross-Bidder Fraud Risk Engine & CBIC Sandbox Gateway** ✅ COMPLETE (Digital document tampering & ELA image analysis, font and metadata anomaly checks, multi-bidder collusion risk detection, shell company flags, and production CBIC GSTN API v2.0 / UIDAI e-KYC Sandbox Gateways with HMAC-SHA256 signature generation and OAuth2 token caching).
- **Phase 8: One-Command Docker Setup, Audit Verification API & Self-Healing Migration** ✅ COMPLETE (Added `docker-compose.yml`, multi-stage Dockerfiles for backend & frontend, `/api/audit/verify` verification endpoints, `backend/scenarios/README.md` documentation, and automatic SQLite column schema migration).
- **Phase 9: Semantic NLP RFP Clause Comparator (100/100 SIH Feature Complete)** ✅ COMPLETE (Implemented `SemanticRFPComparator` dual Gemini LLM & local NLP engine, clause-by-clause evidence extractor, `POST /api/analyze/semantic-comparator` endpoint, and 47 passing tests).
