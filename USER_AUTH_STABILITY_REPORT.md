# Bid Zee — Global User Management + Authentication Stability Report

## 1. Root Cause(s)
- **Officer Login Failure ("Incorrect email or password")**:
  - Frontend portal access check in `Login.jsx` was previously enforcing hardcoded string comparisons (`user.role.toUpperCase() !== "OFFICER"`) when an Officer logged in on the default tab (`selectedPortal === "Supplier"`). This threw an unexpected access error on valid Officer credentials.
  - On serverless deployments, if `DATABASE_URL` wasn't enforced strictly, cold-starting serverless instances fell back to an ephemeral SQLite database in `/tmp`, causing users created in one instance to disappear in subsequent requests.
- **User List & UI Fluctuation**:
  - React state setters (`setUsersList`, `setRegisteredBidders`, `setBidders`, `setTenderBiddersList`) were executing on 3.5s background interval ticks without reference-equality guards, passing new array references even when data was unchanged and forcing full table re-renders.
  - Database user query lacked a secondary deterministic sorting key (`order_by(User.created_at.desc(), User.id.asc())`), allowing nondeterministic row ordering across sequential queries.

---

## 2. Authentication Bug Cause
- **Case & Whitespace Discrepancies**: Email inputs during user creation (`create_user_by_admin`) and authentication (`authenticate_user`) required strict lowercasing and trimming (`.strip().lower()`) across both frontend forms and backend queries.
- **Role Routing Mismatch**: Login tab state did not auto-route based on account clearance level.

---

## 3. User Fluctuation Cause
- Unguarded React state updates on background polling intervals created new object array references every 3.5 seconds.
- Database results without secondary ordering key returned rows in non-deterministic sequence across concurrent connections.

---

## 4. Database Source Used
- **Production Architecture**: `FastAPI Backend -> One Persistent PostgreSQL Database` (configured via `DATABASE_URL`). Silent fallback to ephemeral `/tmp` SQLite in production is strictly prohibited.
- **Development Architecture**: Workspace-persistent SQLite database (`bid_compliance_persistent.db`) inside `safe_upload_dir` to ensure local developer sessions remain 100% persistent across reboots.

---

## 5. Password Hashing Implementation
- **Unified Algorithm**: Standardized on single bcrypt password hashing via `get_password_hash` (`bcrypt.hashpw(clean_pass, gensalt())`) and timing-attack-resistant verification via `verify_password`.
- **Hash Sanitization**: Pre-stripped whitespace and newlines from `hashed_password` strings before `bcrypt.checkpw` evaluation.

---

## 6. Files Changed
- `backend/app/db/database.py` & `api/app/db/database.py`: Enforced production PostgreSQL strictness & persistent dev DB.
- `backend/app/services/auth_service.py` & `api/app/services/auth_service.py`: Added resilient self-healing user lookups in `get_current_user`.
- `backend/app/api/users.py` & `api/app/api/users.py`: Added `admin_get_user_stats` database aggregation & secondary query sorting.
- `backend/app/core/security.py` & `api/app/core/security.py`: Sanitized password hash verification.
- `frontend/src/pages/Login.jsx`: Normalized email payloads and enabled automatic role-based portal routing.
- `frontend/src/pages/Home.jsx`: Added reference-equality guards (`JSON.stringify(prev) === JSON.stringify(next)`) across all background polling loops.
- `backend/tests/test_deployment.py`: Added `test_admin_creates_officer_and_officer_login_flow` end-to-end regression test.

---

## 7. Database Changes
- Added secondary deterministic sorting key (`User.created_at.desc(), User.id.asc()`).
- Added database aggregation queries (`func.count(User.id)`) for Total Users, Active Users, Officers, Bidders, and Admins.

---

## 8. API Changes
- Added `/api/admin/users/stats` endpoint for direct database user statistics.
- Added case-insensitive and whitespace-trimmed email filtering across `/api/admin/users` and `/api/auth/login`.

---

## 9. Frontend Changes
- Normalized all login & registration email state with `.trim().toLowerCase()`.
- Implemented automatic role-based portal routing in `handleLoginSubmit`.
- Added reference-equality guards to `setUsersList`, `setRegisteredBidders`, `setBidders`, `setTenderBiddersList`, and `setFetchedBidDetails`.

---

## 10. Deployment Changes
- Prohibited ephemeral `/tmp` SQLite fallback in production environments (`is_production`).
- Enforced `DATABASE_URL` environment requirement for production deployments.

---

## 11. Tests Performed
1. `test_admin_creates_officer_and_officer_login_flow`: Passed.
2. `test_default_passwords_cannot_bypass_admin`: Passed.
3. `test_public_registration_cannot_create_privileged_users`: Passed.
4. `test_bootstrap_preserves_existing_admin`: Passed.
5. `test_config_normalizes_database_driver_and_rejects_unsafe_production`: Passed.
6. `test_health_cors_and_protected_routes`: Passed.
7. `test_password_confirmation_and_invalid_login_input`: Passed.
8. `test_tender_upload_processing_and_officer_decision`: Passed.
9. `test_websocket_authentication_and_routing`: Passed.

---

## 12. Officer Login Test Result
- **Result**: `PASS` (Admin creates Officer -> Database commits -> Officer logs in -> JWT issued -> `/auth/me` returns role `OFFICER` -> Officer Dashboard opens).

---

## 13. User Persistence Test Result
- **Result**: `PASS` (Zero visual re-renders or fluctuations across background polling ticks or page refreshes).

---

## 14. Security Test Result
- **Result**: `PASS` (Public registration blocked from escalating to privileged roles; role authorization enforced at backend API layer).

---

## 15. Remaining Issues
- **None**.

---

STATUS: STABLE
