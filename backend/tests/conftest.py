"""
Shared fixtures for the backend security/behavior test suite.

The environment is configured BEFORE any app import so the process-wide
settings/engine singletons are built against a private throwaway SQLite
database and a known JWT secret.
"""
import os
import sys
import tempfile

import pytest

_TEST_DB = os.path.join(tempfile.mkdtemp(prefix="bidzee_tests_"), "test.db")

os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DB}"
os.environ["ENVIRONMENT"] = "development"
os.environ["JWT_SECRET"] = "unit-test-secret-0123456789-0123456789-0123456789"
os.environ["SEED_DEMO_ACCOUNTS"] = "false"
os.environ["ALLOW_SEED_ENDPOINT"] = "false"
os.environ["INLINE_PROCESSING"] = "false"  # keep tests fast
os.environ["LOGIN_MAX_ATTEMPTS_PER_IP"] = "100000"  # isolate per-email lockout tests
# Make sure no cloud-runtime detection interferes with local tests.
for _v in ("VERCEL", "AWS_LAMBDA_FUNCTION_NAME", "RENDER", "RAILWAY_ENVIRONMENT"):
    os.environ.pop(_v, None)

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


@pytest.fixture(scope="session")
def app_module():
    from app.main import app
    return app


@pytest.fixture()
def client(app_module):
    """Fresh-schema TestClient per test (drop/recreate all tables)."""
    from fastapi.testclient import TestClient
    from app.db.database import engine
    import app.models  # noqa: F401  (register models)
    from app.db.database import Base

    Base.metadata.drop_all(bind=engine)
    with TestClient(app_module) as c:
        yield c
    Base.metadata.drop_all(bind=engine)


def make_user(db, email, password, role="BIDDER", active=True, status="Active"):
    from app.models.user import User
    from app.core.security import get_password_hash
    u = User(
        full_name=email.split("@")[0].title(),
        email=email,
        password_hash=get_password_hash(password),
        role=role,
        is_active=active,
        status=status,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


def login(client, email, password):
    return client.post("/api/auth/login", json={"email": email, "password": password})


def get_db_session():
    from app.db.database import SessionLocal
    return SessionLocal()
