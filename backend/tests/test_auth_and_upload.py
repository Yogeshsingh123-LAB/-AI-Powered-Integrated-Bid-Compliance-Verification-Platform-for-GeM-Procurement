import os
import io
import uuid
import hashlib

# pyrefly: ignore [missing-import]
import pytest
from datetime import datetime, timezone, timedelta
# pyrefly: ignore [missing-import]
from fastapi.testclient import TestClient
# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import sessionmaker

# Set test environment variables BEFORE importing config/app
os.environ["JWT_SECRET"] = "test_jwt_secret_key_for_compliance_verification"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "5"
os.environ["SUPABASE_URL"] = "https://mock-supabase.co"
os.environ["SUPABASE_SECRET_KEY"] = "sb_secret_mock_secret_key_for_testing"
os.environ["SUPABASE_BUCKET"] = "bid-documents"

from app.main import app
from app.db.database import Base, get_db
from app.models.user import User
from app.models.tender import Tender
from app.models.requirement import Requirement
from app.models.bid import Bid
from app.models.document import Document
from app.models.audit_log import AuditLog
from app.core.security import get_password_hash, create_access_token
from app.services.storage_service import StorageService

# Setup in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, expire_on_commit=False)

# Override get_db dependency
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Create test client
client = TestClient(app)

@pytest.fixture(autouse=True)
def mock_storage_service(monkeypatch):
    monkeypatch.setattr(StorageService, "get_client", lambda: None)

# Helper function to create clean tables before tests
@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield

# --- UNIT TESTS & INTEGRATION TESTS ---

def test_bidder_registration():
    """1. Successful Bidder registration."""
    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "ABC Company Bidder",
            "email": "bidder@example.com",
            "password": "StrongPassword123",
            "role": "BIDDER"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "bidder@example.com"
    assert "password_hash" not in data
    assert "password" not in data
    assert data["role"] == "BIDDER"

def test_registration_duplicate_email():
    """2. Duplicate email rejection."""
    # Register first user
    client.post(
        "/api/auth/register",
        json={
            "full_name": "ABC Company Bidder",
            "email": "bidder@example.com",
            "password": "StrongPassword123",
            "role": "BIDDER"
        }
    )
    # Register second with same email
    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "XYZ Company Bidder",
            "email": "bidder@example.com",
            "password": "OtherPassword456",
            "role": "BIDDER"
        }
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

def test_registration_invalid_password():
    """3. Rejects weak passwords (no uppercase, too short, or no numbers)."""
    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "ABC Company Bidder",
            "email": "bidder@example.com",
            "password": "weak",
            "role": "BIDDER"
        }
    )
    assert response.status_code == 400
    assert "Password must be at least 8 characters" in response.json()["detail"]

def test_successful_login():
    """4. Successful login returns token."""
    # Seed user
    db = TestingSessionLocal()
    user = User(
        full_name="Mock Bidder",
        email="bidder@example.com",
        password_hash=get_password_hash("StrongPassword123"),
        role="BIDDER",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.close()

    # Login
    response = client.post(
        "/api/auth/login",
        json={"email": "bidder@example.com", "password": "StrongPassword123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "bidder@example.com"

def test_wrong_password_login():
    """5. Rejects incorrect password logins."""
    db = TestingSessionLocal()
    user = User(
        full_name="Mock Bidder",
        email="bidder@example.com",
        password_hash=get_password_hash("StrongPassword123"),
        role="BIDDER",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.close()

    response = client.post(
        "/api/auth/login",
        json={"email": "bidder@example.com", "password": "WrongPassword"}
    )
    assert response.status_code == 417 or response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]

def test_inactive_user_login():
    """6. Rejects login from deactivated accounts."""
    db = TestingSessionLocal()
    user = User(
        full_name="Mock Bidder",
        email="bidder@example.com",
        password_hash=get_password_hash("StrongPassword123"),
        role="BIDDER",
        is_active=False
    )
    db.add(user)
    db.commit()
    db.close()

    response = client.post(
        "/api/auth/login",
        json={"email": "bidder@example.com", "password": "StrongPassword123"}
    )
    assert response.status_code == 401
    assert "inactive" in response.json()["detail"]

def test_invalid_jwt():
    """7. Authentication fails with an invalid token."""
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer invalid_token_value"}
    )
    assert response.status_code == 401

def test_expired_jwt():
    """8. Rejects expired JWTs."""
    # Generate expired token
    expired_token = create_access_token(
        subject=str(uuid.uuid4()),
        role="BIDDER",
        expires_delta=timedelta(seconds=-1)
    )
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"}
    )
    assert response.status_code == 401

def test_auth_me():
    """9. Retrieve authenticated user profile information."""
    db = TestingSessionLocal()
    uid = uuid.uuid4()
    user = User(
        id=uid,
        full_name="John Doe",
        email="john@example.com",
        password_hash=get_password_hash("StrongPassword123"),
        role="BIDDER",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.close()

    token = create_access_token(subject=str(uid), role="BIDDER")
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["full_name"] == "John Doe"

def test_role_authorizations():
    """10, 11, 12. Validates role authorization checks (BIDDER, OFFICER, ADMIN)."""
    db = TestingSessionLocal()
    bidder_user = User(id=uuid.uuid4(), email="b@example.com", full_name="B", password_hash="h", role="BIDDER", is_active=True)
    officer_user = User(id=uuid.uuid4(), email="o@example.com", full_name="O", password_hash="h", role="OFFICER", is_active=True)
    admin_user = User(id=uuid.uuid4(), email="a@example.com", full_name="A", password_hash="h", role="ADMIN", is_active=True)
    db.add_all([bidder_user, officer_user, admin_user])
    db.commit()
    db.close()

    bidder_token = create_access_token(str(bidder_user.id), "BIDDER")
    officer_token = create_access_token(str(officer_user.id), "OFFICER")
    admin_token = create_access_token(str(admin_user.id), "ADMIN")

    # Accessing Admin Endpoint: GET /api/admin/users
    # Bidder -> 403
    r1 = client.get("/api/admin/users", headers={"Authorization": f"Bearer {bidder_token}"})
    assert r1.status_code == 403

    # Officer -> 403
    r2 = client.get("/api/admin/users", headers={"Authorization": f"Bearer {officer_token}"})
    assert r2.status_code == 403

    # Admin -> 200
    r3 = client.get("/api/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert r3.status_code == 200

def test_password_change():
    """14. Change password updates credentials securely."""
    db = TestingSessionLocal()
    uid = uuid.uuid4()
    user = User(
        id=uid,
        full_name="User",
        email="user@example.com",
        password_hash=get_password_hash("OldPassword123"),
        role="BIDDER",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.close()

    token = create_access_token(str(uid), "BIDDER")
    response = client.post(
        "/api/auth/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "current_password": "OldPassword123",
            "new_password": "NewPassword456"
        }
    )
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Try login with new password
    response_login = client.post(
        "/api/auth/login",
        json={"email": "user@example.com", "password": "NewPassword456"}
    )
    assert response_login.status_code == 200

def test_admin_user_activation_deactivation():
    """15. Admins can toggle accounts active/inactive."""
    db = TestingSessionLocal()
    uid = uuid.uuid4()
    bidder_user = User(id=uid, email="b@example.com", full_name="B", password_hash="h", role="BIDDER", is_active=True)
    admin_user = User(id=uuid.uuid4(), email="a@example.com", full_name="A", password_hash="h", role="ADMIN", is_active=True)
    db.add_all([bidder_user, admin_user])
    db.commit()
    db.close()

    admin_token = create_access_token(str(admin_user.id), "ADMIN")

    # Deactivate
    response = client.patch(
        f"/api/admin/users/{uid}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"is_active": False}
    )
    assert response.status_code == 200
    assert response.json()["is_active"] is False

    # Verify status in database
    db = TestingSessionLocal()
    u = db.query(User).filter(User.id == uid).first()
    assert u.is_active is False
    db.close()

# --- DOCUMENT UPLOAD PORTION TESTS ---

@pytest.fixture
def seed_test_tender_requirement_bid():
    """Helper fixture to seed tender, requirement, and bid records."""
    db = TestingSessionLocal()
    
    bidder = User(id=uuid.uuid4(), email="bidder@example.com", full_name="Bidder Company", password_hash="h", role="BIDDER", is_active=True)
    other_bidder = User(id=uuid.uuid4(), email="other@example.com", full_name="Other Company", password_hash="h", role="BIDDER", is_active=True)
    officer = User(id=uuid.uuid4(), email="officer@example.com", full_name="Officer User", password_hash="h", role="OFFICER", is_active=True)
    db.add_all([bidder, other_bidder, officer])
    db.commit()

    tender = Tender(id="TENDER-01", title="Test Tender", budget_limit=100000.0, status="Active")
    db.add(tender)
    db.commit()

    req = Requirement(id=uuid.uuid4(), tender_id="TENDER-01", code="GST", description="GST document", is_mandatory=True)
    db.add(req)
    db.commit()

    bid = Bid(id=uuid.uuid4(), tender_id="TENDER-01", bidder_id=bidder.id, status="Pending")
    other_bid = Bid(id=uuid.uuid4(), tender_id="TENDER-01", bidder_id=other_bidder.id, status="Pending")
    db.add_all([bid, other_bid])
    db.commit()

    data = {
        "bidder_id": bidder.id,
        "bidder_token": create_access_token(str(bidder.id), "BIDDER"),
        "other_bidder_token": create_access_token(str(other_bidder.id), "BIDDER"),
        "officer_token": create_access_token(str(officer.id), "OFFICER"),
        "tender_id": tender.id,
        "requirement_id": req.id,
        "requirement_code": req.code,
        "bid_id": bid.id,
        "other_bid_id": other_bid.id
    }
    db.close()
    return data

def test_document_upload_success_pdf(seed_test_tender_requirement_bid):
    """1. Successful PDF upload."""
    data = seed_test_tender_requirement_bid
    file_content = b"%PDF-1.4 dummy pdf content"
    file_io = io.BytesIO(file_content)

    response = client.post(
        "/api/documents/upload",
        headers={"Authorization": f"Bearer {data['bidder_token']}"},
        data={
            "bid_id": str(data["bid_id"]),
            "requirement_id": str(data["requirement_id"])
        },
        files={"file": ("certificate.pdf", file_io, "application/pdf")}
    )
    assert response.status_code == 201
    assert response.json()["success"] is True
    assert response.json()["document"]["status"] == "UPLOADED"

def test_document_upload_success_jpg(seed_test_tender_requirement_bid):
    """2. Successful JPG upload."""
    data = seed_test_tender_requirement_bid
    file_content = b"\xFF\xD8\xFF dummy jpeg image content"
    file_io = io.BytesIO(file_content)

    response = client.post(
        "/api/documents/upload",
        headers={"Authorization": f"Bearer {data['bidder_token']}"},
        data={
            "bid_id": str(data["bid_id"]),
            "requirement_id": str(data["requirement_id"])
        },
        files={"file": ("photo.jpg", file_io, "image/jpeg")}
    )
    assert response.status_code == 201

def test_document_upload_success_png(seed_test_tender_requirement_bid):
    """3. Successful PNG upload."""
    data = seed_test_tender_requirement_bid
    file_content = b"\x89PNG\r\n\x1a\n dummy png image content"
    file_io = io.BytesIO(file_content)

    response = client.post(
        "/api/documents/upload",
        headers={"Authorization": f"Bearer {data['bidder_token']}"},
        data={
            "bid_id": str(data["bid_id"]),
            "requirement_id": str(data["requirement_id"])
        },
        files={"file": ("photo.png", file_io, "image/png")}
    )
    assert response.status_code == 201

def test_document_upload_too_large(seed_test_tender_requirement_bid):
    """4. File larger than 10 MB rejection."""
    data = seed_test_tender_requirement_bid
    file_content = b"0" * (11 * 1024 * 1024)  # 11 MB
    file_io = io.BytesIO(file_content)

    response = client.post(
        "/api/documents/upload",
        headers={"Authorization": f"Bearer {data['bidder_token']}"},
        data={
            "bid_id": str(data["bid_id"]),
            "requirement_id": str(data["requirement_id"])
        },
        files={"file": ("large.pdf", file_io, "application/pdf")}
    )
    assert response.status_code == 413

def test_document_upload_invalid_extension(seed_test_tender_requirement_bid):
    """5. Reject unsupported extensions (e.g. .exe)."""
    data = seed_test_tender_requirement_bid
    file_content = b"dummy exe file content"
    file_io = io.BytesIO(file_content)

    response = client.post(
        "/api/documents/upload",
        headers={"Authorization": f"Bearer {data['bidder_token']}"},
        data={
            "bid_id": str(data["bid_id"]),
            "requirement_id": str(data["requirement_id"])
        },
        files={"file": ("malicious.exe", file_io, "application/pdf")}
    )
    assert response.status_code == 415

def test_document_upload_invalid_mime(seed_test_tender_requirement_bid):
    """6. Reject unsupported MIME types (e.g. text/html)."""
    data = seed_test_tender_requirement_bid
    file_content = b"<html>dummy html</html>"
    file_io = io.BytesIO(file_content)

    response = client.post(
        "/api/documents/upload",
        headers={"Authorization": f"Bearer {data['bidder_token']}"},
        data={
            "bid_id": str(data["bid_id"]),
            "requirement_id": str(data["requirement_id"])
        },
        files={"file": ("index.pdf", file_io, "text/html")}
    )
    assert response.status_code == 415

def test_document_upload_unauthorized_user(seed_test_tender_requirement_bid):
    """7. Unauthorized user (no token) cannot upload."""
    data = seed_test_tender_requirement_bid
    file_content = b"%PDF-1.4 dummy pdf"
    file_io = io.BytesIO(file_content)

    response = client.post(
        "/api/documents/upload",
        data={
            "bid_id": str(data["bid_id"]),
            "requirement_id": str(data["requirement_id"])
        },
        files={"file": ("doc.pdf", file_io, "application/pdf")}
    )
    assert response.status_code == 401

def test_document_upload_cross_bid(seed_test_tender_requirement_bid):
    """8. Bidder cannot upload to another bidder's bid."""
    data = seed_test_tender_requirement_bid
    file_content = b"%PDF-1.4 dummy pdf"
    file_io = io.BytesIO(file_content)

    # other_bidder tries to upload to bidder's bid_id
    response = client.post(
        "/api/documents/upload",
        headers={"Authorization": f"Bearer {data['other_bidder_token']}"},
        data={
            "bid_id": str(data["bid_id"]),
            "requirement_id": str(data["requirement_id"])
        },
        files={"file": ("doc.pdf", file_io, "application/pdf")}
    )
    assert response.status_code == 403

def test_document_upload_duplicate_detection(seed_test_tender_requirement_bid):
    """10. Duplicate document (same hash) upload fails with 409."""
    data = seed_test_tender_requirement_bid
    file_content = b"%PDF-1.4 dummy pdf"
    
    # First upload
    r1 = client.post(
        "/api/documents/upload",
        headers={"Authorization": f"Bearer {data['bidder_token']}"},
        data={"bid_id": str(data["bid_id"]), "requirement_id": str(data["requirement_id"])},
        files={"file": ("file1.pdf", io.BytesIO(file_content), "application/pdf")}
    )
    assert r1.status_code == 201

    # Second upload with same content
    r2 = client.post(
        "/api/documents/upload",
        headers={"Authorization": f"Bearer {data['bidder_token']}"},
        data={"bid_id": str(data["bid_id"]), "requirement_id": str(data["requirement_id"])},
        files={"file": ("file2.pdf", io.BytesIO(file_content), "application/pdf")}
    )
    assert r2.status_code == 409
    assert "already been uploaded" in r2.json()["detail"]

def test_document_listing(seed_test_tender_requirement_bid):
    """11. Listing documents for a bid."""
    data = seed_test_tender_requirement_bid
    db = TestingSessionLocal()
    doc = Document(
        id=uuid.uuid4(),
        bid_id=data["bid_id"],
        requirement_id=data["requirement_id"],
        document_type="GST_CERTIFICATE",
        original_filename="gst.pdf",
        storage_path="mock/path/gst.pdf",
        mime_type="application/pdf",
        file_size=123,
        file_hash="dummyhash",
        document_status="UPLOADED",
        uploaded_by=data["bidder_id"]
    )
    db.add(doc)
    db.commit()
    db.close()

    # Successful listing by owner
    response = client.get(
        f"/api/documents/bid/{data['bid_id']}",
        headers={"Authorization": f"Bearer {data['bidder_token']}"}
    )
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["original_filename"] == "gst.pdf"

    # Blocked listing by cross bidder
    response_cross = client.get(
        f"/api/documents/bid/{data['bid_id']}",
        headers={"Authorization": f"Bearer {data['other_bidder_token']}"}
    )
    assert response_cross.status_code == 403

def test_document_download_url(seed_test_tender_requirement_bid):
    """12, 13. Authorized and unauthorized document signed URL generation."""
    data = seed_test_tender_requirement_bid
    db = TestingSessionLocal()
    doc_id = uuid.uuid4()
    doc = Document(
        id=doc_id,
        bid_id=data["bid_id"],
        requirement_id=data["requirement_id"],
        document_type="GST_CERTIFICATE",
        original_filename="gst.pdf",
        storage_path="mock/path/gst.pdf",
        mime_type="application/pdf",
        file_size=123,
        file_hash="dummyhash",
        document_status="UPLOADED",
        uploaded_by=data["bidder_id"]
    )
    db.add(doc)
    db.commit()
    db.close()

    # Authorized download (bid owner)
    r_auth = client.get(
        f"/api/documents/{doc_id}/download",
        headers={"Authorization": f"Bearer {data['bidder_token']}"}
    )
    assert r_auth.status_code == 200
    assert "download_url" in r_auth.json()

    # Unauthorized download (cross bidder)
    r_unauth = client.get(
        f"/api/documents/{doc_id}/download",
        headers={"Authorization": f"Bearer {data['other_bidder_token']}"}
    )
    assert r_unauth.status_code == 403

def test_document_deletion(seed_test_tender_requirement_bid):
    """14. Document deletion removes metadata and storage file."""
    data = seed_test_tender_requirement_bid
    db = TestingSessionLocal()
    doc_id = uuid.uuid4()
    doc = Document(
        id=doc_id,
        bid_id=data["bid_id"],
        requirement_id=data["requirement_id"],
        document_type="GST_CERTIFICATE",
        original_filename="gst.pdf",
        storage_path="mock/path/gst.pdf",
        mime_type="application/pdf",
        file_size=123,
        file_hash="dummyhash",
        document_status="UPLOADED",
        uploaded_by=data["bidder_id"]
    )
    db.add(doc)
    db.commit()
    db.close()

    response = client.delete(
        f"/api/documents/{doc_id}",
        headers={"Authorization": f"Bearer {data['bidder_token']}"}
    )
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Verify database removed
    db = TestingSessionLocal()
    d = db.query(Document).filter(Document.id == doc_id).first()
    assert d is None
    db.close()

def test_document_replacement(seed_test_tender_requirement_bid):
    """15. Document replacement marks old as REPLACED and uploads new."""
    data = seed_test_tender_requirement_bid
    db = TestingSessionLocal()
    doc_id = uuid.uuid4()
    doc = Document(
        id=doc_id,
        bid_id=data["bid_id"],
        requirement_id=data["requirement_id"],
        document_type="GST_CERTIFICATE",
        original_filename="gst.pdf",
        storage_path="mock/path/gst.pdf",
        mime_type="application/pdf",
        file_size=123,
        file_hash="oldhash",
        document_status="UPLOADED",
        uploaded_by=data["bidder_id"]
    )
    db.add(doc)
    db.commit()
    db.close()

    new_file = io.BytesIO(b"%PDF-1.4 updated file content")
    response = client.post(
        f"/api/documents/{doc_id}/replace",
        headers={"Authorization": f"Bearer {data['bidder_token']}"},
        files={"file": ("updated_gst.pdf", new_file, "application/pdf")}
    )
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Verify statuses in database
    db = TestingSessionLocal()
    old_record = db.query(Document).filter(Document.id == doc_id).first()
    assert old_record.document_status == "REPLACED"

    new_record = db.query(Document).filter(
        Document.bid_id == data["bid_id"],
        Document.document_status == "UPLOADED"
    ).first()
    assert new_record is not None
    assert new_record.original_filename == "updated_gst.pdf"
    db.close()


def test_analyze_empty_file_upload():
    """16. Uploading a zero-byte empty file returns 400 Bad Request."""
    empty_file = io.BytesIO(b"")
    response = client.post(
        "/api/analyze",
        files={"file": ("empty_doc.pdf", empty_file, "application/pdf")}
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_analyze_unsupported_file_extension():
    """17. Uploading an invalid file extension returns 400 Bad Request."""
    invalid_file = io.BytesIO(b"malicious script content")
    response = client.post(
        "/api/analyze",
        files={"file": ("script.exe", invalid_file, "application/octet-stream")}
    )
    assert response.status_code == 400
    assert "unsupported file format" in response.json()["detail"].lower()


def test_seed_endpoint_production_gating():
    """18. Database seed endpoint returns 403 Forbidden in production environment."""
    from app.core.config import settings
    original_env = settings.ENVIRONMENT
    try:
        settings.ENVIRONMENT = "production"
        response = client.post("/api/auth/seed")
        assert response.status_code == 403
        assert "disabled in production" in response.json()["detail"].lower()
    finally:
        settings.ENVIRONMENT = original_env

