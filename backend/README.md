# GeM Bid Compliance API - Backend Foundation

This is the backend for the AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement.

## Technology Stack
- **Python 3.11+**
- **FastAPI**
- **PostgreSQL / Supabase**
- **SQLAlchemy 2.x**
- **Pydantic Settings**
- **JWT authentication**
- **python-multipart**
- **PyMuPDF & Tesseract OCR**

---

## Setup & Run Instructions

### 1. Create a Virtual Environment
Open your terminal, navigate to the `backend` directory, and run:
```bash
cd backend
python -m venv venv
```

### 2. Activate the Virtual Environment (Windows)
Run the activation script:
```powershell
.\venv\Scripts\activate
```

### 3. Install Dependencies
Install required python packages:
```bash
pip install -r requirements.txt
```

### 4. Database Setup
Configure PostgreSQL (`DATABASE_URL`) in `backend/.env`, together with Supabase Storage credentials and `INITIAL_ADMIN_PASSWORD` for a new database. Startup fails clearly if the configured database is unavailable; there is no silent SQLite fallback. See [the deployment guide](../docs/DEPLOYMENT.md). SQLite is used only by isolated regression tests.

### 5. Generate Mock Data & Sample Documents
Run data seeds and test document generators:
```bash
python generate_mock_data.py
python generate_sample_pdfs.py
```

### 6. Start the FastAPI Development Server
From the `backend` directory, launch Uvicorn:
```bash
uvicorn app.main:app --reload --port 8000
```
*The server will be running at: `http://127.0.0.1:8000`*

### 7. Interactive API Documentation
Open your browser to:
- **Interactive Docs (Swagger UI)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Alternative Docs (ReDoc)**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## Analysis API Contract

`POST /api/analyze` accepts a multipart form upload under the `file` key. Supported file types include PDF, JPG, JPEG, and PNG up to a **10 MB** size limit (`MAX_FILE_SIZE = 10MB`).

Successful responses include `text_extraction`, `extracted_identifiers`, `verification_details`, `compliance_report`, and audit tracking:
```json
{
  "success": true,
  "filename": "bid_document.pdf",
  "text_extraction": {"total_pages": 1, "pages_detail": []},
  "extracted_identifiers": {"gstin": [], "pan": [], "udyam": []},
  "verification_details": {"gstin": [], "pan": [], "udyam": []},
  "compliance_report": {
    "score": 85,
    "risk_level": "LOW",
    "breakdown": {},
    "deductions": [],
    "recommendations": []
  }
}
```

The compliance score evaluates `presence (30) + database verification (40) + registry integrity (30)`, clamped to 0-100. Deductions apply for missing primary mandatory procurement identifiers (GSTIN/PAN), status suspensions, or registry name mismatches. Blacklisted vendors are flagged as `HIGH` risk with a full integrity deduction.

---

## Admin User Management & Officer Access APIs

The platform provides administrative APIs for managing user accounts, officer access requests, password resets, and user roles:

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/admin/users` | List all registered users with role & status filters | Admin (`ADMIN`, `SUPER_ADMIN`) |
| `PUT` | `/api/admin/users/{user_id}` | Full profile update (name, email, department, role, active status). Requires `admin_authorization_password`. | Admin |
| `PATCH` | `/api/admin/users/{user_id}` | Partial profile update (name, email, department, role, active status). Requires `admin_authorization_password`. | Admin |
| `PATCH` | `/api/admin/users/{user_id}/status` | Update account status (`Active`, `Pending Approval`, `Suspended`, `Inactive`) / Grant Access. Requires `admin_authorization_password`. | Admin |
| `POST` | `/api/admin/users/{user_id}/reset-password` | Administrative password reset for user account. Requires `admin_authorization_password`. | Admin |
| `DELETE` | `/api/admin/users/{user_id}` | Delete user account (with audit log safeguard). Requires `admin_authorization_password`. | Admin |

> **Security Requirement**: All sensitive administrative write actions require validating the current administrator's password via the `admin_authorization_password` field to prevent unauthorized role escalation or status modifications.

---

## Verification Gateway — MCA21 Live Adapter (`data.gov.in`)

The verification gateway uses an extensible **Adapter Pattern** with per-registry mode configuration:

- **MCA21 Adapter (`DataGovMCAAdapter`)**: Integrates live with the Government of India Open Data Platform (`data.gov.in`) MCA Company Master Data (~3.67M corporate entries under GODL license).
  - **API Endpoint**: `https://api.data.gov.in/resource/41233261-26c9-4f24-9b1a-ae970c675f92`
  - **Query Parameters**: `api-key=<key>&format=json&limit=5&filters[corporate_identification_number]=<CIN>` or `filters[company_name]=<NAME>`
  - **Extracted Attributes**: `corporate_identification_number`, `company_name`, `company_status`, `roc_code`, `authorized_capital`, `paid_up_capital`, `date_of_registration`, `registered_office_address`.
  - **Configuration (`backend/.env`)**:
    ```ini
    MCA_GATEWAY_MODE=live
    DATA_GOV_IN_API_KEY=<your-data.gov.in-api-key>   # never commit real keys
    DATA_GOV_IN_MCA_RESOURCE_ID=41233261-26c9-4f24-9b1a-ae970c675f92
    ```
  - Includes local fallback mechanism if external API is unreachable or rate limited.
- **Other Registries**: GSTN, PAN, Udyam, EPFO, ESIC, DigiLocker, and Debarment use simulated adapters pre-wired for production gateway swap (Sandbox.co.in / Setu).

---


## Security & Audit Features
- **Cryptographic Audit Trail**: Every security and compliance action writes a SHA-256 chain hash (`blockchain_hash`) linking to the previous audit log entry.
- **Constant-Time Verification**: Password verification includes side-channel timing attack defenses.
- **Filename Sanitization**: Uploaded files undergo regex sanitization (`re.sub(r'[^a-zA-Z0-9._-]', '_', ...)`) and payload size validation.

---

## 🔑 Account Bootstrap (No Hardcoded Credentials)

The platform contains **no hardcoded account passwords**. Bootstrap behaviour:

- **Production / cloud:** first admin created from `INITIAL_ADMIN_EMAIL` + `INITIAL_ADMIN_PASSWORD`
  (environment). Forced password change at first login. Startup fails if no active ADMIN exists.
- **Development only:** `SEED_DEMO_ACCOUNTS=true` creates clearly-labelled demo accounts;
  `ALLOW_SEED_ENDPOINT=true` enables the dev-only `POST /api/auth/seed` route (never mounted in
  production or on cloud runtimes).

The previously published default credentials are retired and must be treated as compromised.
See the root `README.md` → "Security Posture" for the rotation checklist.

