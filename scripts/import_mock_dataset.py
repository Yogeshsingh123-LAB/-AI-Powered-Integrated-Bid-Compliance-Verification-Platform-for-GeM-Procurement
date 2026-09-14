import sys
import os
import argparse
import json
import uuid
from datetime import datetime, timezone

# Add backend directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.db.database import SessionLocal
from app.models.user import User
from app.models.tender import Tender
from app.models.bid import Bid
from app.models.document import Document
from app.models.requirement import Requirement

def import_dataset(user_email: str, dataset_key: str):
    db = SessionLocal()
    try:
        # 1. Find user
        user = db.query(User).filter(User.email.lower() == user_email.lower()).first()
        if not user:
            print(f"Error: User with email '{user_email}' not found. Please create the user first.")
            return False

        if user.role.upper() != "BIDDER":
            print(f"Error: User '{user_email}' has role '{user.role}', but must be 'BIDDER' to import a dataset.")
            return False

        # 2. Load dataset profile
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "mock-data"))
        profile_path = os.path.join(base_dir, "dataset", dataset_key, "profile.json")
        if not os.path.exists(profile_path):
            print(f"Error: Dataset profile '{profile_path}' does not exist.")
            return False

        with open(profile_path, "r", encoding="utf-8") as f:
            profile = json.load(f)

        # Update user company details
        user.department = profile["company"]
        db.commit()

        # 3. Find or create an active tender
        tender = db.query(Tender).first()
        if not tender:
            print("Creating sample live tender for dataset import...")
            tender = Tender(
                id="GEM/2026/B/8912",
                title="Supply and Maintenance of High Performance Server Racks",
                department="CPCL - Chennai Petroleum Corporation Limited",
                value="₹ 45,00,000",
                deadline="28 Feb 2026",
                category="Goods",
                status="ACTIVE"
            )
            db.add(tender)
            db.commit()
            db.refresh(tender)

        # 4. Find or create Bid for this user & tender
        bid = db.query(Bid).filter(Bid.bidder_id == user.id, Bid.tender_id == tender.id).first()
        if not bid:
            bid = Bid(
                id=uuid.uuid4(),
                tender_id=tender.id,
                bidder_id=user.id,
                status="Pending",
                compliance_score=86.0 if dataset_key == "bidder_01" else (70.0 if dataset_key == "bidder_02" else 55.0),
                submitted_at=datetime.now(timezone.utc)
            )
            db.add(bid)
            db.commit()
            db.refresh(bid)

        # 5. Create Documents for this Bid from dataset documents
        docs_dir = os.path.join(base_dir, "documents", dataset_key)
        doc_files = [
            ("DOC-PAN", "PAN_Certificate.pdf", "PAN"),
            ("DOC-GST", "GSTIN_Registration.pdf", "GST"),
            ("DOC-MSME", "Udyam_Certificate.pdf", "UDYAM"),
            ("DOC-FIN", "ITR_Acknowledgement.pdf", "INCOME_TAX")
        ]
        if dataset_key != "bidder_03":
            doc_files.append(("DOC-TECH", "OEM_Authorization.pdf", "OEM_AUTH"))

        for req_code, filename, doc_type in doc_files:
            file_path = os.path.join(docs_dir, filename)
            if not os.path.exists(file_path):
                continue

            existing_doc = db.query(Document).filter(
                Document.bid_id == bid.id,
                Document.document_type == doc_type
            ).first()

            if not existing_doc:
                new_doc = Document(
                    id=uuid.uuid4(),
                    bid_id=bid.id,
                    uploaded_by_user_id=user.id,
                    document_type=doc_type,
                    file_path=file_path,
                    original_filename=filename,
                    file_size=os.path.getsize(file_path),
                    document_status="VERIFIED" if dataset_key == "bidder_01" else ("PROCESSED" if dataset_key == "bidder_02" else "UPLOADED"),
                    uploaded_at=datetime.now(timezone.utc)
                )
                db.add(new_doc)

        db.commit()
        print(f"Successfully imported dataset '{dataset_key}' ({profile['company']}) for user '{user_email}'!")
        return True

    except Exception as e:
        db.rollback()
        print(f"Error importing dataset: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Import mock dataset for a specific Bidder account")
    parser.add_argument("--user-email", required=True, help="Email address of the target logged-in Bidder user")
    parser.add_argument("--dataset", default="bidder_01", choices=["bidder_01", "bidder_02", "bidder_03"], help="Dataset key to import")
    args = parser.parse_args()

    import_dataset(args.user_email, args.dataset)
