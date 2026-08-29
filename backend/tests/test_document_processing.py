import io
import uuid
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.database import Base, get_db
from app.models.user import User
from app.models.tender import Tender
from app.models.requirement import Requirement
from app.models.bid import Bid
from app.models.document import Document
from app.models.document_ocr import DocumentOCR
from app.models.document_extraction import DocumentExtraction
from app.core.security import get_password_hash, create_access_token
from app.services.storage_service import StorageService
from app.services.ocr_service import OCRService
from app.services.document_classifier import DocumentClassifier
from app.services.ai_extraction_service import AIExtractionService
from app.services.document_processing_service import process_document

# In-memory/local SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_processing.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, expire_on_commit=False)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(autouse=True)
def db_override():
    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.pop(get_db, None)

client = TestClient(app)

def generate_test_pdf_bytes(text_to_insert: str) -> bytes:
    import fitz
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 50), text_to_insert)
    pdf_bytes = doc.write()
    doc.close()
    return pdf_bytes

@pytest.fixture(autouse=True)
def mock_storage_service(monkeypatch):
    # Prevent real Supabase calls during tests
    monkeypatch.setattr(StorageService, "get_client", lambda: None)
    monkeypatch.setattr(
        StorageService, 
        "download_file", 
        lambda path: generate_test_pdf_bytes("Registration Certificate Goods and Services Tax GSTIN 27AAPCS1234M1Z5 legal name ABC INDUSTRIES")
    )

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield

# Helper to seed base data
@pytest.fixture
def seed_data():
    db = TestingSessionLocal()
    
    bidder = User(id=uuid.uuid4(), email="bidder@example.com", full_name="Bidder Company", password_hash=get_password_hash("Pass123"), role="BIDDER", is_active=True)
    other_bidder = User(id=uuid.uuid4(), email="other@example.com", full_name="Other Company", password_hash=get_password_hash("Pass123"), role="BIDDER", is_active=True)
    officer = User(id=uuid.uuid4(), email="officer@example.com", full_name="Officer", password_hash=get_password_hash("Pass123"), role="OFFICER", is_active=True)
    db.add_all([bidder, other_bidder, officer])
    db.commit()

    tender = Tender(id="TENDER-P1", title="Procurement 1", budget_limit=50000.0, status="Active")
    db.add(tender)
    db.commit()

    req = Requirement(id=uuid.uuid4(), tender_id="TENDER-P1", code="GST", description="GST certificate", is_mandatory=True)
    db.add(req)
    db.commit()

    bid = Bid(id=uuid.uuid4(), tender_id="TENDER-P1", bidder_id=bidder.id, status="Pending")
    other_bid = Bid(id=uuid.uuid4(), tender_id="TENDER-P1", bidder_id=other_bidder.id, status="Pending")
    db.add_all([bid, other_bid])
    db.commit()

    doc = Document(
        id=uuid.uuid4(),
        bid_id=bid.id,
        requirement_id=req.id,
        document_type="GST_CERTIFICATE",
        original_filename="gst.pdf",
        storage_path="mock/gst.pdf",
        mime_type="application/pdf",
        file_size=100,
        file_hash="mockhash",
        document_status="UPLOADED",
        uploaded_by=bidder.id
    )
    db.add(doc)
    db.commit()

    data = {
        "bidder_id": bidder.id,
        "bidder_token": create_access_token(str(bidder.id), "BIDDER"),
        "other_bidder_token": create_access_token(str(other_bidder.id), "BIDDER"),
        "officer_token": create_access_token(str(officer.id), "OFFICER"),
        "doc_id": doc.id,
        "bid_id": bid.id
    }
    db.close()
    return data

# --- TEST CASES ---

def test_ocr_service_digital_pdf():
    """1. Test PyMuPDF digital PDF text extraction."""
    pdf_data = generate_test_pdf_bytes("Registration Certificate Goods and Services Tax GSTIN 27AAPCS1234M1Z5")
    res = OCRService.extract_text_from_pdf(pdf_data)
    assert res["success"] is True
    assert "GSTIN" in res["text"]
    assert res["ocr_engine"] == "pdf_digital"

def test_ocr_service_image_extraction():
    """2. Test image-based OCR extraction structure."""
    from PIL import Image
    img = Image.new("RGB", (1, 1), color="white")
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="PNG")
    real_image_bytes = img_byte_arr.getvalue()
    
    res = OCRService.extract_text_from_image(real_image_bytes)
    assert res["success"] is True
    assert res["ocr_engine"] in {"tesseract", "mock_tesseract", "tesseract_unavailable"}

def test_document_classification():
    """3. Test GST classification."""
    gst_text = "Registration Certificate issued under Goods and Services Tax containing GSTIN 27AAPCS1234M1Z5"
    res = DocumentClassifier.classify(gst_text)
    assert res["document_type"] == "GST_CERTIFICATE"
    assert res["confidence"] > 0.8

    pan_text = "Permanent Account Number Card issued by Income Tax Department details: AAPCS1234M"
    res_pan = DocumentClassifier.classify(pan_text)
    assert res_pan["document_type"] == "PAN"

    udyam_text = "UDYAM Registration Certificate for Micro Enterprise MSME"
    res_udyam = DocumentClassifier.classify(udyam_text)
    assert res_udyam["document_type"] == "UDYAM"

def test_structured_ai_extraction_gst():
    """4. Test AI schema mapping and missing fields."""
    gst_text = "GSTIN: 27AAPCS1234M1Z5, Legal Name: ABC INDUSTRIES, Address: Ahmedabad, Gujarat"
    res = AIExtractionService.extract_fields(gst_text, "GST_CERTIFICATE")
    assert res["document_type"] == "GST_CERTIFICATE"
    assert res["fields"]["gstin"] == "27AAPCS1234M1Z5"
    assert res["fields"]["legal_name"] == "ABC INDUSTRIES"
    # Trade name was not in the text, so mock/AI should set it to None or Trade Name fallback
    # And confidence should be computed accordingly
    assert "missing_fields" in res
    assert "requires_review" in res

def test_process_document_pipeline_success(seed_data):
    """5. Test the entire synchronous process pipeline."""
    data = seed_data
    db = TestingSessionLocal()
    
    updated_doc = process_document(db, data["doc_id"], data["officer_token"])
    
    assert updated_doc.document_status in {"PROCESSED", "REQUIRES_REVIEW"}
    
    # Check extraction record in db
    ext = db.query(DocumentExtraction).filter(DocumentExtraction.document_id == data["doc_id"]).first()
    assert ext is not None
    assert ext.document_type == "GST_CERTIFICATE"
    assert "gstin" in ext.extracted_data
    
    db.close()

def test_api_process_authorization(seed_data):
    """6. API POST /process is Officer/Admin only."""
    data = seed_data
    
    # Bidder tries to process -> 403 Forbidden
    r_bidder = client.post(
        f"/api/documents/{data['doc_id']}/process",
        headers={"Authorization": f"Bearer {data['bidder_token']}"}
    )
    assert r_bidder.status_code == 403

    # Officer tries to process -> 200 OK
    r_officer = client.post(
        f"/api/documents/{data['doc_id']}/process",
        headers={"Authorization": f"Bearer {data['officer_token']}"}
    )
    assert r_officer.status_code == 200
    assert r_officer.json()["success"] is True

def test_api_get_extraction_auth(seed_data):
    """7. API GET /extraction handles bidder ownership vs other bidder access."""
    data = seed_data
    db = TestingSessionLocal()
    
    # Pre-add extraction record
    ext = DocumentExtraction(
        document_id=data["doc_id"],
        document_type="GST_CERTIFICATE",
        extracted_data={"gstin": "27AAPCS1234M1Z5", "legal_name": "ABC INDUSTRIES", "trade_name": None},
        raw_text="mock text",
        confidence_score=0.90,
        processing_status="PROCESSED"
    )
    db.add(ext)
    db.commit()
    db.close()

    # Owner Bidder gets extraction -> 200 OK
    r_owner = client.get(
        f"/api/documents/{data['doc_id']}/extraction",
        headers={"Authorization": f"Bearer {data['bidder_token']}"}
    )
    assert r_owner.status_code == 200
    assert r_owner.json()["document_type"] == "GST_CERTIFICATE"
    assert r_owner.json()["extracted_fields"]["gstin"] == "27AAPCS1234M1Z5"
    assert "trade_name" in r_owner.json()["missing_fields"] # Null key added to missing fields

    # Other Bidder tries to get extraction -> 403 Forbidden
    r_other = client.get(
        f"/api/documents/{data['doc_id']}/extraction",
        headers={"Authorization": f"Bearer {data['other_bidder_token']}"}
    )
    assert r_other.status_code == 403

    # Officer gets extraction -> 200 OK
    r_officer = client.get(
        f"/api/documents/{data['doc_id']}/extraction",
        headers={"Authorization": f"Bearer {data['officer_token']}"}
    )
    assert r_officer.status_code == 200

def test_api_reprocess_endpoint(seed_data):
    """8. Reprocess endpoint preserves extraction history."""
    data = seed_data
    
    # Run process twice
    r1 = client.post(
        f"/api/documents/{data['doc_id']}/reprocess",
        headers={"Authorization": f"Bearer {data['officer_token']}"}
    )
    assert r1.status_code == 200
    
    r2 = client.post(
        f"/api/documents/{data['doc_id']}/reprocess",
        headers={"Authorization": f"Bearer {data['officer_token']}"}
    )
    assert r2.status_code == 200
    
    db = TestingSessionLocal()
    extractions = db.query(DocumentExtraction).filter(DocumentExtraction.document_id == data["doc_id"]).all()
    # Should have 2 records in database (history preserved)
    assert len(extractions) >= 2
    db.close()
