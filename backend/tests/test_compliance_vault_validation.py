import pytest
import uuid
from app.db.database import SessionLocal
from app.models.user import User
from app.models.tender import Tender
from app.models.requirement import Requirement
from app.models.bid import Bid
from app.models.document import Document
from app.models.notification import Notification
from app.services.document_processing_service import process_document

def test_wrong_document_rejection_and_notification():
    db = SessionLocal()
    try:
        # 1. Fetch or create test bidder
        bidder = db.query(User).filter(User.role == "BIDDER").first()
        assert bidder is not None, "Test bidder must exist in DB"

        # 2. Fetch or create test tender CPCL/2026/003
        tender = db.query(Tender).filter(Tender.id == "CPCL/2026/003").first()
        if not tender:
            tender = db.query(Tender).first()
        assert tender is not None, "Test tender must exist"

        # 3. Create or fetch Bid
        bid = db.query(Bid).filter(Bid.tender_id == tender.id, Bid.bidder_id == bidder.id).first()
        if not bid:
            bid = Bid(
                id=uuid.uuid4(),
                tender_id=tender.id,
                bidder_id=bidder.id,
                status="Pending",
                compliance_score=0.0
            )
            db.add(bid)
            db.commit()

        # 4. Fetch GST requirement
        req_gst = db.query(Requirement).filter(
            Requirement.tender_id == tender.id,
            Requirement.code == "GST"
        ).first()
        if not req_gst:
            req_gst = Requirement(
                id=uuid.uuid4(),
                tender_id=tender.id,
                code="GST",
                description="GST Registration Certificate",
                is_mandatory=True
            )
            db.add(req_gst)
            db.commit()

        # 5. Create test document simulating wrong upload (e.g. class notes PDF)
        doc = Document(
            id=uuid.uuid4(),
            bid_id=bid.id,
            requirement_id=req_gst.id,
            uploaded_by=bidder.id,
            document_type="UNKNOWN",
            original_filename="pdf_rendition_1.pdf",
            storage_path="uploads/test_class_notes.pdf",
            mime_type="application/pdf",
            file_hash="a"*64,
            file_size=1024,
            document_status="UPLOADED"
        )
        db.add(doc)
        db.commit()

        # 6. Run background processing logic (Catching storage call in test)
        try:
            process_document(
                db=db,
                document_id=doc.id,
                user_id=bidder.id
            )
        except Exception as proc_err:
            print(f"Captured processing pipeline result: {proc_err}")

        # 7. Assert Document is REJECTED
        db.refresh(doc)
        assert doc.document_status == "REJECTED", f"Expected REJECTED status, got {doc.document_status}"
        assert doc.rejection_reason is not None, "Rejection reason must be set"
        assert "GST" in doc.rejection_reason, "Rejection reason must mention GST"

        # 8. Assert Notification was saved to DB
        notif = db.query(Notification).filter(
            Notification.document_id == doc.id,
            Notification.type == "DOCUMENT_REJECTED"
        ).first()
        assert notif is not None, "Persistent notification must be recorded in database"
        assert "rejected" in notif.message.lower()

        print("\n[SUCCESS] Verification Test Passed: Wrong document correctly rejected and persistent notification logged.")
    finally:
        db.close()

if __name__ == "__main__":
    test_wrong_document_rejection_and_notification()
