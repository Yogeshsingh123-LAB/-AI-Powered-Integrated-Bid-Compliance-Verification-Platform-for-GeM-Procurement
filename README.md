# AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement

**Problem Statement ID**: 26100  
This repository contains both the **Frontend** and **Backend** components of the GeM Bid Compliance Platform structured as a clean mono-repo.

---

## 1. Directory Structure

```
SIH_TRAILS/
├── frontend/               # React / Vite SPA Client
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── backend/                # FastAPI / SQLAlchemy 2.x API Server
│   ├── app/
│   ├── requirements.txt
│   └── .env
├── brain.md                # System Architecture & API Blueprint
└── README.md               # Main instructions (this file)
```

---

## 2. Operation Instructions

### A. Frontend (React Client)
To launch the frontend interface:
1. Navigate to the `frontend/` folder:
   ```bash
   cd frontend
   ```
2. Install client dependencies (if needed):
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The client will be running at: [http://localhost:5174/](http://localhost:5174/)*

---

### B. Backend (FastAPI Server)
To launch the backend API:
1. Navigate to the `backend/` folder:
   ```bash
   cd backend
   ```
2. Create and activate a python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   ```
3. Install packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI application:
   ```bash
   uvicorn app.main:app --reload
   ```
   *The Swagger interactive API docs will be at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)*