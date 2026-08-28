# Project Brain: GeM Bid Compliance Verification Platform

This document serves as the central brain, architecture guide, and design repository for the **AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement** (Problem Statement ID: 26100).

---

## 1. System Overview & Objectives
The goal of this platform is to automate compliance checking for bids submitted on the Government e-Marketplace (GeM). By replacing slow, manual document inspections with AI OCR parsing and verification against official government registry APIs, the platform prevents bid rigging, simplifies verification, and guarantees transparent auditing.

---

## 2. Platform Architecture

```mermaid
graph TD
    A[React/Vite Frontend] -- HTTP / JSON + JWT Bearer --> B[FastAPI Backend Engine]
    B -- SQLAlchemy 2.x --> C[(PostgreSQL Database)]
    B -- Supabase Storage --> D[Private Storage Bucket]
    B -- External Integration --> E[Govt API Gateways]
    B -- OCR Processing --> F[AI OCR Parser]
```

### Frontend (User Interface)
- **Tech Stack**: React 18, Vite, Custom Vanilla CSS, Lucide Icons.
- **Design Aesthetic**: Space-themed futuristic dark UI (`#060913`) featuring glassmorphism elements, custom diagonal slide transitions, 3D mouse parallax tilt, and custom theme overrides (neon green/emerald for Supplier Terminal, neon red/crimson for Audit Console).
- **Separated Login & Selector Gateway**:
  - **Portal Selection Landing page**: Entry screen featuring interactive cards to select either the Supplier Procurement Terminal or the Administrative Audit Console.
  - **Supplier Procurement Terminal**: Supports login and self-registration. Submits requests directly to the backend authentication APIs.
  - **Administrative Audit Console**: Restricted login-only interface for government auditors. Does not allow public signup.
- **Strict Role Boundaries & Access Checks**:
  - Enforces client-side role validation against the JWT: `BIDDER` accounts are denied entry to the Administrative Audit Console and display a warning banner.
  - Restores active sessions automatically on mount by checking the validity of the JWT token via `/api/auth/me`.
  - Clears browser storage securely upon Sign Out.
- **Role-Based Views**:
  - **Procurement Officer / Buyer**: Master Audit Queue, bid details inspection, compliance audit reports, logs console, and compliance sign-off actions.
  - **Admin**: User credentials management, API gateways connectivity toggles, and dynamic compliance rules weight tuning.
  - **Bidder / Supplier**: Secure document upload terminal, bid status milestones tracker, and corporate profiles.

### Backend (Core Engine)
- **Tech Stack**: Python 3.11+, FastAPI, SQLAlchemy 2.x (ORM), Alembic (Migrations), Neon PostgreSQL.
- **Security**: Stateless JWT-based session tokens, password strength verification, and bcrypt password hashing via `passlib`.
- **CORS Configuration**: Open-access configured to allow seamless communication with dev clients on ports `5173` and `5174`.

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
- `timestamp` (DateTime)
- `user_id` (UUID, Optional, ForeignKey -> Users)
- `user_role` (String, Optional)
- `action` (String)
- `details` (Text, Optional)
- `ip_address` (String, Optional)

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
| `POST` | `/api/analyze` | Main PDF compliance analysis endpoint | No | None |
| `POST` | `/api/documents/upload` | Upload compliance document for a bid | Yes | `BIDDER` |
| `GET` | `/api/documents/bid/{bid_id}` | List all uploaded documents for a bid | Yes | `BIDDER` (Owner), `OFFICER`, `ADMIN` |
| `GET` | `/api/documents/{doc_id}/download` | Generate temporary signed download URL | Yes | `BIDDER` (Owner), `OFFICER`, `ADMIN` |
| `POST` | `/api/documents/{doc_id}/replace` | Replace an uploaded document | Yes | `BIDDER` (Owner) |
| `DELETE` | `/api/documents/{doc_id}` | Delete a document from bucket & DB | Yes | `BIDDER` (Owner) |
| `POST` | `/api/chat` | Ask the GeMmy platform and bid-compliance assistant | No | None |

---

## 5. Development Phases Status

- **Phase 1: AI OCR Integration** ✅ COMPLETE (PyMuPDF, OpenCV preprocessors, and Tesseract OCR document parsing + spaCy NER entity extractors)
- **Phase 2: Government API Connectors** ✅ COMPLETE (Faker database seeds + GSTIN/PAN/Udyam/Blacklist gateways with REST RESTful lookups & offline JSON fallbacks)
- **Phase 3: Compliance Scoring Algorithm** ✅ COMPLETE (Completeness/Verification/Integrity weighted scoring engine + name alignment suffix token matcher)
- **Phase 4: End-to-End Integration** ✅ COMPLETE (Main POST `/api/analyze` endpoint orchestration, upload handling, scoring report formatters, audit trail entries)
- **Phase 5: Testing & Validation** ✅ COMPLETE (4 validation test suites, 5 scenario PDF mock documents, TestClient integration tests)
- **Phase 6: UI/UX & Refactoring** ✅ COMPLETE (Configurable environmental base URL, API request timeout controls, upload dropzone locks, frontend validation, unique ID mappings, and milestone empty states)
- **Phase 7: Separate Portals & Secure Auth** ✅ COMPLETE (Separated Supplier/Officer login portals, integrated backend JWT sessions, client-side session auto-login check via `/api/auth/me`, and access-denied security blocks)
- **Phase 8: Premium Dashboards & Compliance Exporters** ✅ COMPLETE (Transitioned layout to full-width horizontal top navigation; implemented Create Tender progress wizard, Bidders Applications registry with real-time filters and CSV/PDF exporters, advanced AI verification compliance matrix, and the Compliance Evidence & Final Decision dashboard)

