#!/usr/bin/env python3
"""
Bid Zee — Mock Dataset Importer Script
Imports a standalone test dataset (bidder_01, bidder_02, bidder_03) for a specified user email.

Usage:
    python scripts/import_mock_dataset.py --email banti@example.com --dataset bidder_01
    python scripts/import_mock_dataset.py --email arnav@example.com --dataset bidder_02 --tender GEM/2026/B/8912
"""

import sys
import os
import json
import argparse
import uuid
import shutil
from datetime import datetime, timezone

# Add parent directory to path so app modules can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

def import_dataset(email: str, dataset_name: str, tender_id: str = "GEM/2026/B/8912"):
    from app.db.database import SessionLocal
    from app.models.user import User
    from app.models.bid import Bid
    from app.models.tender import Tender
    from app.models.requirement import Requirement
    from app.models.document import Document

    db = SessionLocal()
    try:
        # 1. Find or create user
        email_clean = email.strip().lower()
        user = db.query(User).filter(User.email.ilike(email_clean)).first()
        if not user:
            print(f"[Import] User '{email_clean}' not found in database. Creating user...")
            from app.core.security import get_password_hash
            user = User(
                id=uuid.uuid4(),
                full_name=email_clean.split("@")[0].replace(".", " ").title(),
                email=email_clean,
                password_hash=get_password_hash("Password@123"),
                role="BIDDER",
                status="Active"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # 2. Read dataset profile
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "mock-data"))
        profile_path = os.path.join(base_dir, "dataset", dataset_name, "profile.json")
        if not os.path.exists(profile_path):
            raise FileNotFoundError(f"Dataset profile not found at: {profile_path}")

        with open(profile_path, "r", encoding="utf-8") as f:
            profile = json.load(f)

        print(f"[Import] Loaded Dataset: {dataset_name} - Company: '{profile.get('company')}'")

        # 3. Ensure target tender exists
        tender = db.query(Tender).filter(Tender.id == tender_id).first()
        if not tender:
            print(f"[Import] Tender '{tender_id}' not found. Creating default tender...")
            tender = Tender(
                id=tender_id,
                title="Procurement of Server Hardware and Cloud Infrastructure Services",
                description="Supply, deployment, and 3-year maintenance of enterprise server infrastructure.",
                category="Services",
                department="CPCL - Chennai Petroleum Corporation Limited",
                budget_limit=12500000.00,
                status="ACTIVE"
            )
            db.add(tender)
            db.commit()

        # 4. Create Bid for target user
        score = 100.0 if dataset_name == "bidder_01" else (86.0 if dataset_name == "bidder_02" else 60.0)
        bid = Bid(
            id=uuid.uuid4(),
            tender_id=tender_id,
            bidder_id=user.id,
            compliance_score=score,
            status="Compliant" if score >= 85 else ("Under Review" if score >= 70 else "Non-Compliant"),
            submitted_at=datetime.now(timezone.utc)
        )
        db.add(bid)
        db.commit()
        db.refresh(bid)

        # 5. Link documents
        doc_dir = os.path.join(base_dir, "documents", dataset_name)
        storage_target_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "uploads"))
        os.makedirs(storage_target_dir, exist_ok=True)

        created_docs = []
        if os.path.exists(doc_dir):
            for file_name in os.listdir(doc_dir):
                if file_name.endswith(".pdf"):
                    src_path = os.path.join(doc_dir, file_name)
                    target_file = f"{bid.id}_{file_name}"
                    dst_path = os.path.join(storage_target_dir, target_file)
                    shutil.copy2(src_path, dst_path)

                    # Create requirement if needed
                    doc_type = file_name.replace(".pdf", "").upper()
                    req = db.query(Requirement).filter(Requirement.tender_id == tender_id, Requirement.code == doc_type).first()
                    if not req:
                        req = Requirement(
                            id=uuid.uuid4(),
                            tender_id=tender_id,
                            code=doc_type,
                            description=f"{doc_type} Compliance Certificate",
                            is_mandatory=True
                        )
                        db.add(req)
                        db.commit()
                        db.refresh(req)

                    doc_obj = Document(
                        id=uuid.uuid4(),
                        bid_id=bid.id,
                        requirement_id=req.id,
                        document_type=doc_type,
                        original_filename=file_name,
                        storage_path=dst_path,
                        mime_type="application/pdf",
                        file_size=os.path.getsize(dst_path),
                        file_hash="MOCK_HASH_" + uuid.uuid4().hex[:16],
                        document_status="VERIFIED",
                        uploaded_by=user.id
                    )
                    db.add(doc_obj)
                    created_docs.append(file_name)

            db.commit()

        print("\n============================================================")
        print("BID ZEE — MOCK DATASET IMPORT SUCCESSFUL")
        print("============================================================")
        print(f"Target User Email: {user.email}")
        print(f"User ID:           {user.id}")
        print(f"Dataset Imported:  {dataset_name}")
        print(f"Company Name:      {profile.get('company')}")
        print(f"PAN Number:        {profile.get('pan')}")
        print(f"GSTIN:             {profile.get('gstin')}")
        print(f"Generated Bid ID:  {bid.id}")
        print(f"Attached Docs ({len(created_docs)}): {', '.join(created_docs)}")
        print("============================================================\n")

    except Exception as e:
        db.rollback()
        print(f"[Import Error] Failed to import dataset: {e}", file=sys.stderr)
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Import Bid Zee Mock Dataset for a User")
    parser.add_argument("--email", "--user-email", required=True, help="Target user email (e.g. banti@example.com)")
    parser.add_argument("--dataset", required=True, choices=["bidder_01", "bidder_02", "bidder_03"], help="Dataset to import")
    parser.add_argument("--tender", default="GEM/2026/B/8912", help="Tender ID to attach bid to")
    args = parser.parse_args()

    import_dataset(email=args.email, dataset_name=args.dataset, tender_id=args.tender)
