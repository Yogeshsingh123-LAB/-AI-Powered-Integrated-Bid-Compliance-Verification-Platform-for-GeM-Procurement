# BidVerify — Production Deployment & Architecture Guide

## 1. Primary Production Architecture

BidVerify separates client rendering, business logic execution, object storage, and relational data management:

```
                  USER BROWSER
                       │
                       ▼
               VERCEL FRONTEND
               (React 19 + Vite)
                       │
                       │ HTTPS / REST API
                       ▼
               FASTAPI BACKEND
         (Render / Railway / Docker)
                       │
            ┌──────────┴──────────┐
            ▼                     ▼
   SUPABASE POSTGRESQL    SUPABASE STORAGE
   (Managed Database)     (Document Storage)
```

---

## 2. Frontend Deployment Configuration (Vercel)

### Vercel Project Settings (Option A — Root Directory: `frontend`)
- **Root Directory**: `frontend`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Vercel Monorepo Settings (Option B — Root Directory: `/`)
- **Root Directory**: `/`
- **Build Command**: `npm run build` (triggers root `package.json` workspace build)
- **Output Directory**: `frontend/dist`
- **Root Configuration (`vercel.json`)**:
```json
{
  "framework": "vite",
  "buildCommand": "npm run build --prefix frontend",
  "outputDirectory": "frontend/dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 3. Backend Deployment Configuration (FastAPI)

- **Backend Location**: `backend/` or `api/`
- **Runtime**: Python 3.10+
- **Production Start Command**:
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port $PORT
  ```
- **Health Check Endpoint**: `GET /health` or `GET /api/health`

---

## 4. Production Environment Variables Reference

### Frontend Environment Variables (Vercel Project Settings)
Only public/client-safe variables are exposed with `VITE_`:

| Variable Name | Purpose | Example Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL of deployed FastAPI backend | `https://bidverify-api.onrender.com` |

> **SECURITY NOTICE**: Never expose `DATABASE_URL`, `JWT_SECRET`, `AI_API_KEY`, or Supabase service-role credentials in `VITE_` variables.

### Backend Environment Variables (Render / Railway Project Settings)

| Variable Name | Purpose | Example Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | Supabase / Neon PostgreSQL connection string | `postgresql://user:pass@host:5432/neondb?sslmode=require` |
| `JWT_SECRET` | Secret key for JWT authentication | `production_super_secret_jwt_key_hash` |
| `CORS_ORIGINS` | Allowed frontend origin domains | `https://bidverify.vercel.app,http://localhost:5173` |
| `SUPABASE_URL` | Supabase API endpoint for file storage | `https://your-project.supabase.co` |
| `SUPABASE_SECRET_KEY` | Supabase secret key for storage access | `eyJhbGciOi...` |
| `SUPABASE_BUCKET` | Supabase Storage bucket name | `bid-documents` |

---

## 5. Database Schema & Self-Healing Migrations

Managed PostgreSQL schema applied automatically via `apply_schema_migrations()` on application startup:

- **Tables**: `users`, `tenders`, `bids`, `documents`, `audit_logs`, `requirements`
- **Performance Indexes**:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_bids_tender_id ON bids(tender_id);
  CREATE INDEX IF NOT EXISTS idx_bids_bidder_id ON bids(bidder_id);
  CREATE INDEX IF NOT EXISTS idx_bids_status ON bids(status);
  CREATE INDEX IF NOT EXISTS idx_bids_officer_status ON bids(officer_status);
  CREATE INDEX IF NOT EXISTS idx_bids_compliance_score ON bids(compliance_score);
  CREATE INDEX IF NOT EXISTS idx_bids_submitted_at ON bids(submitted_at DESC);
  CREATE INDEX IF NOT EXISTS idx_tenders_status ON tenders(status);
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  ```

---

## 6. Build & Verification Commands

### Frontend Verification
```bash
# Build from repository root
npm run build

# Build from frontend directory
cd frontend
npm install
npm run build
npm test
```

### Backend Integration Tests
```bash
python tests/auth_integration.test.py
```
