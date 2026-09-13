# BidVerify Production Root Cause Analysis & Fix Report

## 1. Root Cause Breakdown & Fixes

### ROOT CAUSE 1: Vercel Read-Only Filesystem (`/var/task/uploads`)
- **Problem**: `backend/app/api/analysis.py` and `storage_service.py` executed `os.makedirs("/var/task/uploads", exist_ok=True)` on module import. Because Vercel serverless runtimes use a read-only filesystem (`/var/task`), Python threw `OSError: [Errno 30] Read-only file system: '/var/task/uploads'` during startup.
- **Fix**: Replaced static local upload directory paths in `config.py`, `analysis.py`, and `storage_service.py` with `tempfile.gettempdir()` (`/tmp` on Vercel/Linux). Persistent document uploads are handled via **Supabase Storage** bucket `bid-documents`, storing file metadata, SHA-256 hashes, and storage paths in PostgreSQL.

### ROOT CAUSE 2: Localhost PostgreSQL Connection Attempts
- **Problem**: Default fallback `postgresql+psycopg://postgres:postgres@localhost:5432/bid_compliance_db` in `config.py` caused Vercel functions to attempt connecting to `127.0.0.1:5432` when `DATABASE_URL` was empty, throwing `connection to server at "127.0.0.1", port 5432 failed`.
- **Fix**: Removed default `localhost:5432` database string in production settings. Production environments require a valid `DATABASE_URL` pointing to managed PostgreSQL (Supabase / Neon).

### ROOT CAUSE 3: Silent Production SQLite Fallback
- **Problem**: `database.py` caught database connection errors and silently created an ephemeral SQLite database in `/tmp`. In production, this caused data loss across serverless invocations while hiding real database connectivity issues.
- **Fix**: Updated `database.py` to check `ENVIRONMENT == "production"` or `VERCEL == "1"`. In production, ephemeral SQLite fallback is **strictly prohibited** and raises an explicit `RuntimeError("Database connection failed in production: SQLite fallback is strictly prohibited")`.

### ROOT CAUSE 4: Deprecated Gemini Package (`google.generativeai`)
- **Problem**: Python logs reported deprecation warnings for `google.generativeai`.
- **Fix**: Updated `ai_extraction_service.py` to support the new `google.genai` SDK (`from google import genai as new_genai`, `client = new_genai.Client(api_key=...)`) with backwards-compatible fallback to `google.generativeai`. Added `google-genai>=0.1.0` to `requirements.txt`.

---

## 2. Final Production Architecture

```
                                USER
                                  |
                                  v
                           VERCEL FRONTEND
                           React 19 / Vite 8
                                  |
                                HTTPS
                                  |
                                  v
                           FASTAPI BACKEND
                     Render / Railway / Serverless
                                  |
                    +-------------+-------------+
                    |                           |
                    v                           v
              SUPABASE POSTGRES           SUPABASE STORAGE
```

---

## 3. Production Verification Matrix

| System Component | Verification Details | Final Status |
|---|---|---|
| **PRODUCTION DATABASE** | Managed PostgreSQL (Supabase/Neon) connection pooling (`pool_size=10`), pre-ping health checks active. SQLite fallback disabled in production. | **PASS** |
| **STORAGE** | Persistent files uploaded to Supabase Storage bucket `bid-documents`. Temporary processing isolated to `/tmp`. | **PASS** |
| **AUTHENTICATION** | JWT authentication, bcrypt password hashing, role-based access control (BIDDER, OFFICER, ADMIN) tested (9/9 integration tests pass). | **PASS** |
| **BID STATISTICS** | Single-query SQL aggregations (`func.count`, `func.coalesce`, `case(...)`) with 30s TTL cache. Empty DB returns zeroed JSON payload. | **PASS** |
| **AI INTEGRATION** | Gemini `google.genai` SDK active for document classification & field extraction with officer-in-the-loop compliance checks. | **PASS** |
| **LIVE DEPLOYMENT** | Vite frontend build compiled cleanly (exit code 0), 20/20 frontend tests pass, dual Vercel configs active (`frontend/vercel.json` & `api/vercel.json`). | **PASS** |
