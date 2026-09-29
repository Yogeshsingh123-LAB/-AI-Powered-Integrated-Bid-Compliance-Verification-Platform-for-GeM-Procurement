"""Standalone end-to-end regression runner for the four P0 audit defects.

Run directly::

    python3 tests/p0_regression_runner.py --mode dev
    python3 tests/p0_regression_runner.py --mode serverless

It is deliberately a **script**, not a pytest module: it has to mutate
``os.environ`` *before* importing the app (settings are a process-wide
singleton), and doing that inside a pytest session would poison the other
test modules. ``tests/test_p0_fixes.py`` therefore invokes it as a subprocess.

Exits 0 and prints ``ALL CHECKS PASSED`` when every check succeeds.
"""

import argparse
import os
import sys
import tempfile
import uuid

_HERE = os.path.dirname(os.path.abspath(__file__))
_BACKEND = os.path.abspath(os.path.join(_HERE, ".."))
sys.path.insert(0, _BACKEND)

PDF = (
    b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
    b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
    b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj\n"
    b"4 0 obj<</Length 44>>stream\nBT /F1 12 Tf 72 720 Td (GST) Tj ET\nendstream endobj\n"
    b"trailer<</Size 5/Root 1 0 R>>\nstartxref\n0\n%%EOF\n"
)

OFFICER = {"email": "officer@example.com", "password": "Off!cerSecure#2026x"}
BIDDER = {"email": "bidder@example.com", "password": "Bid!derSecure#2026x"}
ADMIN = {"email": "admin@example.com", "password": "Adm!nSecure#2026x"}
ADMIN_ROTATED = "Adm!nRotated#2026x"

_RESULTS = []


def check(name, condition, detail=""):
    _RESULTS.append((name, bool(condition), detail))
    status = "PASS" if condition else "FAIL"
    print(f"  [{status}] {name}" + (f" — {detail}" if detail and not condition else ""))
    return bool(condition)


def configure(mode):
    """Set the environment for the requested scenario (before any app import)."""
    db_dir = tempfile.mkdtemp(prefix=f"bidzee_p0_{mode}_")
    os.environ["DATABASE_URL"] = f"sqlite:///{os.path.join(db_dir, 'p0.db')}"
    os.environ["JWT_SECRET"] = "p0-regression-secret-0123456789-0123456789-0123456789"
    os.environ["SEED_DEMO_ACCOUNTS"] = "false"
    os.environ["ALLOW_SEED_ENDPOINT"] = "false"
    os.environ["INLINE_PROCESSING"] = "false"
    os.environ.pop("SUPABASE_URL", None)
    os.environ.pop("SUPABASE_SECRET_KEY", None)
    os.environ.pop("ALLOW_LOCAL_UPLOADS", None)
    for var in ("VERCEL", "AWS_LAMBDA_FUNCTION_NAME", "RENDER", "RAILWAY_ENVIRONMENT"):
        os.environ.pop(var, None)

    if mode == "dev":
        os.environ["ENVIRONMENT"] = "development"
        os.environ.pop("DOCUMENT_STORAGE_BACKEND", None)
    elif mode == "serverless":
        # The exact configuration of the live Vercel deployment.
        os.environ["ENVIRONMENT"] = "production"
        os.environ["VERCEL"] = "1"
        os.environ["DOCUMENT_STORAGE_BACKEND"] = "db"
        os.environ["INITIAL_ADMIN_EMAIL"] = ADMIN["email"]
        os.environ["INITIAL_ADMIN_PASSWORD"] = ADMIN["password"]
    else:
        raise SystemExit(f"unknown mode: {mode}")


def run(mode):
    from fastapi.testclient import TestClient
    from app.main import app as fastapi_app
    from app.db.database import Base, engine, SessionLocal
    from app.models.user import User
    from app.core.security import get_password_hash
    from app.services.storage_service import StorageService
    import app.models  # noqa: F401

    print(f"\n=== P0 regression ({mode}) ===")

    if mode == "serverless":
        check("production guard active", StorageService.is_production() is True)
        check("supabase NOT configured", StorageService.is_supabase_configured() is False)
        check("backend resolves to durable 'db'",
              StorageService.resolve_backend() == "db", StorageService.resolve_backend())
    else:
        check("backend resolves to 'local' in development",
              StorageService.resolve_backend() == "local", StorageService.resolve_backend())

    Base.metadata.drop_all(bind=engine)

    with TestClient(fastapi_app) as client:
        db = SessionLocal()
        db.add(User(full_name="Bidder", email=BIDDER["email"],
                    password_hash=get_password_hash(BIDDER["password"]),
                    role="BIDDER", is_active=True))
        if mode == "dev":
            db.add(User(full_name="Officer", email=OFFICER["email"],
                        password_hash=get_password_hash(OFFICER["password"]),
                        role="OFFICER", is_active=True))
        db.commit()
        db.close()

        def auth(creds):
            r = client.post("/api/auth/login", json=creds)
            assert r.status_code == 200, r.text
            return {"Authorization": f"Bearer {r.json()['access_token']}"}

        # ---- Defect 4: /health -------------------------------------------
        for path in ("/health", "/api/health"):
            r = client.get(path)
            ok = check(f"GET {path} -> 200 healthy",
                       r.status_code == 200 and r.json().get("status") == "healthy",
                       f"{r.status_code} {r.text[:120]}")

        # ---- officer credentials -----------------------------------------
        if mode == "serverless":
            o_head = auth(ADMIN)
            r = client.post("/api/auth/change-password", headers=o_head, json={
                "current_password": ADMIN["password"],
                "new_password": ADMIN_ROTATED,
            })
            check("bootstrapped admin rotates initial password", r.status_code == 200, r.text)
            o_head = auth({"email": ADMIN["email"], "password": ADMIN_ROTATED})
        else:
            o_head = auth(OFFICER)
        b_head = auth(BIDDER)

        # ---- create tender -> bid -> upload ------------------------------
        r = client.post("/api/tenders", headers=o_head, json={
            "title": f"P0 Regression Tender ({mode})",
            "description": "Created by the P0 regression runner.",
            "budget_limit": 1000000,
            "status": "Active",
            "requirements": [
                {"code": "GST", "description": "Valid GST registration certificate.",
                 "is_mandatory": True}
            ],
        })
        check("officer creates tender", r.status_code in (200, 201), r.text)
        tender = r.json()["tender"]
        requirement_id = tender["requirements"][0]["id"]

        r = client.post("/api/bids", headers=b_head, json={"tender_id": tender["id"]})
        check("bidder applies", r.status_code in (200, 201), r.text)
        bid_id = r.json()["bid"]["id"]

        # ---- Defect 1: document upload -----------------------------------
        r = client.post("/api/documents/upload", headers=b_head,
                        data={"bid_id": bid_id, "requirement_id": requirement_id},
                        files={"file": ("gst_certificate.pdf", PDF, "application/pdf")})
        check("bidder uploads document (Defect 1)",
              r.status_code in (200, 201), f"{r.status_code} {r.text[:200]}")
        upload_body = r.json()
        doc_id = ((upload_body.get("document") or {}).get("id")
                  or upload_body.get("id") or upload_body.get("document_id"))
        check("upload response carries the document id", bool(doc_id), str(upload_body)[:200])

        from app.models.document import Document
        db = SessionLocal()
        try:
            doc = db.query(Document).filter(
                Document.id == uuid.UUID(str(doc_id))).first()
            check("document row persisted", doc is not None)
            if doc:
                data = StorageService.download_file(doc.storage_path)
                check("bytes round-trip through the storage backend",
                      data.startswith(b"%PDF"), f"got {len(data)} bytes")
        finally:
            db.close()

        # ---- Defect 2: audit chain verification --------------------------
        r = client.get(f"/api/audit/bids/{bid_id}/verify", headers=o_head)
        check("bid audit chain verify -> 200", r.status_code == 200, r.text)
        body = r.json()
        check("chain reports CHAIN_VALID on clean data (Defect 2)",
              body.get("chain_integrity_verified") is True
              and body.get("status") == "CHAIN_VALID", str(body)[:300])
        check("chain has records", body.get("total_records", 0) > 0)
        check("every record verifies",
              all(d["integrity_verified"] for d in body.get("verification_details", [])))

        first_log = body["verification_details"][0]["log_id"]
        r = client.get(f"/api/audit/verify/{first_log}", headers=o_head)
        check("single-record verify -> VALID_TAMPER_FREE (Defect 2)",
              r.status_code == 200 and r.json().get("integrity_verified") is True
              and r.json().get("status") == "VALID_TAMPER_FREE", r.text[:300])

        # Tamper detection must still work.
        db = SessionLocal()
        try:
            log = db.query(__import__("app.models.audit_log", fromlist=["AuditLog"])
                           .AuditLog).filter(
                __import__("app.models.audit_log", fromlist=["AuditLog"]).AuditLog.bid_id
                == uuid.UUID(str(bid_id))).first()
            log.new_value = "tampered-by-regression-runner"
            db.commit()
            tampered_id = str(log.id)
        finally:
            db.close()
        r = client.get(f"/api/audit/verify/{tampered_id}", headers=o_head)
        check("verifier still detects real tampering",
              r.status_code == 200 and r.json().get("integrity_verified") is False
              and r.json().get("status") == "CORRUPTED_TAMPERED", r.text[:300])

        # ---- Defect 3: the view's data source ----------------------------
        r = client.get(f"/api/bids/{bid_id}", headers=b_head)
        check("bid detail -> 200", r.status_code == 200, r.text)
        bid = r.json()
        matrix = bid.get("compliance_matrix") or []
        check("compliance_matrix is populated (Defect 3)", len(matrix) > 0)
        row = matrix[0] if matrix else {}
        check("matrix row carries status/uploaded/file_name",
              row.get("uploaded") is True and row.get("file_name") == "gst_certificate.pdf"
              and row.get("document_id") == str(doc_id), str(row)[:200])
        check("score is a real number, not the old hard-coded 86",
              isinstance(bid.get("compliance_score"), (int, float)))
        check("risk_level is a real band",
              bid.get("risk_level") in {"LOW", "MEDIUM", "HIGH", "CRITICAL"},
              str(bid.get("risk_level")))

        # ---- empty bid must score 0, never 86 ---------------------------
        r = client.post("/api/tenders", headers=o_head, json={
            "title": f"Empty Bid Tender ({mode})",
            "description": "No documents will be uploaded.",
            "budget_limit": 500000, "status": "Active",
            "requirements": [{"code": "PAN", "description": "PAN card.",
                              "is_mandatory": True}],
        })
        check("officer creates second tender", r.status_code in (200, 201), r.text)
        tender2 = r.json()["tender"]
        r = client.post("/api/bids", headers=b_head, json={"tender_id": tender2["id"]})
        check("bidder applies to second tender", r.status_code in (200, 201), r.text)
        bid2_id = r.json()["bid"]["id"]
        r = client.get(f"/api/bids/{bid2_id}", headers=b_head)
        bid2 = r.json()
        check("empty bid scores 0 (never a fabricated 86)",
              bid2.get("compliance_score") == 0, str(bid2.get("compliance_score")))
        check("empty bid's requirement is MISSING",
              (bid2.get("compliance_matrix") or [{}])[0].get("status") == "MISSING")

    Base.metadata.drop_all(bind=engine)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=("dev", "serverless"), required=True)
    args = parser.parse_args()

    configure(args.mode)
    run(args.mode)

    failed = [n for n, ok, _ in _RESULTS if not ok]
    print(f"\n{len(_RESULTS) - len(failed)}/{len(_RESULTS)} checks passed"
          f" ({args.mode})")
    if failed:
        print("FAILED: " + ", ".join(failed))
        return 1
    print("ALL CHECKS PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
