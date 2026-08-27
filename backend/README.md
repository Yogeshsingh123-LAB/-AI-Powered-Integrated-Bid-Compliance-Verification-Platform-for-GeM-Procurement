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

### 5. Start the FastAPI Development Server
From the `backend` directory, execute:
```bash
uvicorn app.main:app --reload
```

### 6. Open Swagger Documentation
Open your web browser and navigate to:
- Interactive Docs (Swagger UI): [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Alternative Docs (ReDoc): [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
