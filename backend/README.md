# GeM Bid Compliance API - Backend Foundation

This is the backend foundation for the AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement.

## Technology Stack
- **Python 3.11+**
- **FastAPI**
- **PostgreSQL**
- **SQLAlchemy 2.x**
- **Alembic**
- **Pydantic Settings**
- **JWT authentication**
- **python-multipart**

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
Install all the required python packages:
```bash
pip install -r requirements.txt
```

### 4. Start PostgreSQL Server
Ensure PostgreSQL is installed and running on your system.
You can start/verify it via Windows Services, or run this in a terminal running with Administrator privileges:
```powershell
net start postgresql-x64-16
```
*(Note: Replace `postgresql-x64-16` with the exact version-specific name of your installed PostgreSQL service.)*

Create a local database named:
`gem_bid_compliance`

### 5. Start the API Development Server
For the integrated OCR and compliance pipeline used by the React dashboard:
```bash
python app.py
```
The Flask API listens on `http://127.0.0.1:5000`.

The original foundation server is still available when database-backed FastAPI routes are added:
From the `backend` directory, execute:
```bash
uvicorn app.main:app --reload
```

### 6. Open Swagger Documentation
Open your web browser and navigate to:
- Interactive Docs (Swagger UI): [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Alternative Docs (ReDoc): [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

## Analysis API Contract

`POST /api/analyze` accepts a multipart form upload under the `file` key. Only PDF files are accepted, with a 16 MB limit.

Successful responses include `text_extraction`, `extracted_identifiers`, `verification_details`, and `compliance_report`:
```json
{
	"success": true,
	"filename": "bid.pdf",
	"text_extraction": {"total_pages": 1, "pages_detail": []},
	"extracted_identifiers": {"gstin": [], "pan": [], "udyam": []},
	"verification_details": {"gstin": [], "pan": [], "udyam": []},
	"compliance_report": {
		"score": 0,
		"risk_level": "HIGH",
		"breakdown": {},
		"deductions": [],
		"recommendations": []
	}
}
```

The score is `presence (30) + database verification (40) + registry integrity (30)`, clamped to 0-100. Risk is `LOW` at 85+, `MEDIUM` at 50-84, and `HIGH` below 50. A blacklisted vendor is always `HIGH` risk and receives a full integrity deduction.

Invalid uploads return `400`; unreadable PDFs return `422`, both with `{ "success": false, "error": "..." }`.

Set `VITE_API_URL` in the frontend environment to point the upload form at another API host; it defaults to `http://127.0.0.1:5000`.
