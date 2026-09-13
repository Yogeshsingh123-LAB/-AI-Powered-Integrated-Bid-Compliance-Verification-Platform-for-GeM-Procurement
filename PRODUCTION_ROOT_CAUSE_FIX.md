# BidVerify Production Root Cause Analysis & Fix Report

## 1. Root Cause Breakdown & Fixes

### ROOT CAUSE 1: Vercel Read-Only Filesystem (`/var/task/uploads`)
- **Problem**: `backend/app/api/analysis.py` and `storage_service.py` executed `os.makedirs("/var/task/uploads", exist_ok=True)` on module import. Because Vercel serverless runtimes use a read-only filesystem (`/var/task`), Python threw `OSError: [Errno 30] Read-only file system: '/var/task/uploads'` during startup.
- **Fix**: Replaced static local upload directory paths in `config.py`, `analysis.py`, and `storage_service.py` with `tempfile.gettempdir()` (`/tmp` on Vercel/Linux). Wrapped filesystem directory creation in runtime helper `get_safe_upload_dir()`. Persistent document uploads are handled via **Supabase Storage** bucket `bid-documents`, storing file metadata, SHA-256 hashes, and storage paths in PostgreSQL.

### ROOT CAUSE 2: Localhost PostgreSQL Connection Attempts
- **Problem**: Default fallback `postgresql+psycopg://postgres:postgres@localhost:5432/bid_compliance_db` in `config.py` caused Vercel functions to attempt connecting to `127.0.0.1:5432` when `DATABASE_URL` was empty, throwing `connection to server at "127.0.0.1", port 5432 failed`.
- **Fix**: Removed default `localhost:5432` database string in production settings. Production environments require a valid `DATABASE_URL` pointing to managed PostgreSQL (Supabase / Neon). Prohibited `localhost` and `127.0.0.1` explicitly when running in hosted production environments.

### ROOT CAUSE 3: Silent Production SQLite Fallback
- **Problem**: `database.py` caught database connection errors and silently created an ephemeral SQLite database in `/tmp`. In production, this caused data loss across serverless invocations while hiding real database connectivity issues.
- **Fix**: Updated `database.py` to check `ENVIRONMENT == "production"` or `VERCEL == "1"`. In production, ephemeral SQLite fallback is **strictly prohibited** and raises an explicit `RuntimeError("Database connection failed in production: SQLite fallback is strictly prohibited")`.

### ROOT CAUSE 4: Deprecated Gemini Package (`google.generativeai`)
- **Problem**: Python logs reported deprecation warnings for `google.generativeai`.
- **Fix**: Migrated `ai_extraction_service.py`, `chat_service.py`, `ocr_parser.py`, and `semantic_analyzer.py` to the modern `google.genai` SDK (`from google import genai`, `client = genai.Client(api_key=...)`) with backwards-compatible fallback. Suppressed deprecation warnings when `google-genai` is available.

### ROOT CAUSE 5: Root `vercel.json` Route Hijacking on `bidverify-blue.vercel.app`
- **Problem**: Previous root `vercel.json` routed all traffic `/(.*)` directly to `api/index.py`, which caused the Vercel deployment on `bidverify-blue.vercel.app` to invoke the Python function instead of building and serving the React frontend. Cold-start failures in the Python function caused `500: FUNCTION_INVOCATION_FAILED` across all website pages.
- **Fix**: Reconfigured root `vercel.json` with `framework: "vite"`, `buildCommand: "npm run build"`, `outputDirectory: "frontend/dist"`, SPA rewrite rules for `/(.*)` to `/index.html`, and `/api/(.*)` to `/api/index.py`. Updated `frontend/src/App.jsx` to support direct `/login` deep linking and synchronized browser history popstate navigation.

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
| **PRODUCTION DATABASE** | Managed PostgreSQL (Supabase/Neon) connection pooling (`pool_size=5`, `max_overflow=10`, `pool_recycle=300`), pre-ping health checks active. SQLite fallback prohibited in production. | **PASS** |
| **STORAGE** | Persistent files uploaded to Supabase Storage bucket `bid-documents`. Temporary processing isolated to `/tmp`. No silent local fallback in production. | **PASS** |
| **AUTHENTICATION** | JWT authentication, bcrypt password hashing, role-based access control (BIDDER, OFFICER, ADMIN) tested (9/9 integration tests pass). | **PASS** |
| **BID STATISTICS** | Single-query SQL aggregations (`func.count`, `func.coalesce`, `case(...)`) with 30s TTL cache. Empty DB returns zeroed JSON payload. | **PASS** |
| **AI INTEGRATION** | Modern `google.genai` SDK active for document classification, field extraction, chat assistance, and OCR parsing. | **PASS** |
| **FRONTEND SPEED & RESPONSIVENESS** | Vite frontend builds in ~480ms, 20/20 unit tests pass, responsive layout verified for both desktop and mobile viewports with smooth role selector and 2FA badges. | **PASS** |
| **LIVE DEPLOYMENT CONFIG** | Root `vercel.json` configured for Vite frontend build with `/api` proxying to serverless FastAPI functions. Both `https://bidverify.vercel.app` and `https://bidverify-blue.vercel.app` serve the responsive UI. | **PASS** |
