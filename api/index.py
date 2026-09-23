import os
import sys

# Vercel serverless entrypoint.
#
# SECURITY/MAINTAINABILITY: the canonical backend lives in backend/.
# An older partial copy of the app package used to live next to this file and was imported with
# higher path priority, causing the deployed API to silently diverge from
# the repository. The duplicate has been removed; only backend/ is used.
api_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(api_dir, ".."))
backend_dir = os.path.join(root_dir, "backend")

if not os.path.isdir(backend_dir):
    raise RuntimeError(
        "Vercel entrypoint cannot find the backend/ package. "
        "Restore backend/ or update vercel.json to point at it."
    )

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Remove this directory from the import path (defensive): only backend/ provides 'app'.
sys.path = [p for p in sys.path if os.path.abspath(p) != api_dir]

from app.main import app as fastapi_app  # noqa: E402

app = fastapi_app


def _bootstrap_demo_data() -> None:
    """Cloud demo bootstrap for serverless (Vercel) deployments.

    The hardened backend intentionally never seeds credentials from source
    code, and a serverless filesystem is ephemeral: every cold start begins
    with an empty database. To keep the public demo usable, demo accounts
    and the sample tender/bid are provisioned here from the *private*
    environment variable ``BIDZEE_DEMO_USERS`` (a JSON list of
    ``{email, role, full_name, password}``).

    - When the variable is unset, nothing is seeded and the app stays
      fail-closed (no default credentials).
    - Users are only created when missing; existing users are never
      overwritten, so in-instance password changes survive warm starts.
    """
    import json
    import logging
    import uuid

    raw = (os.environ.get("BIDZEE_DEMO_USERS") or "").strip()
    if not raw:
        return
    try:
        demo_users = json.loads(raw)
    except ValueError:
        logging.getLogger("app.vercel").warning(
            "BIDZEE_DEMO_USERS is set but is not valid JSON; skipping demo bootstrap"
        )
        return
    if not isinstance(demo_users, list):
        return

    from app.core.security import get_password_hash
    from app.db.database import SessionLocal, initialize_database
    from app.models.bid import Bid
    from app.models.requirement import Requirement
    from app.models.tender import Tender
    from app.models.user import User

    try:
        initialize_database()
    except Exception as exc:  # pragma: no cover - serverless edge case
        logging.getLogger("app.vercel").error("Demo bootstrap DB init failed: %s", exc)
        return

    db = SessionLocal()
    try:
        bidder_user = None
        for ud in demo_users:
            if not isinstance(ud, dict):
                continue
            email = (ud.get("email") or "").strip()
            password = ud.get("password") or ""
            if not email or not password:
                continue
            existing = db.query(User).filter(User.email == email).first()
            if existing is not None:
                if (ud.get("role") or "").upper() == "BIDDER":
                    bidder_user = existing
                continue
            user = User(
                full_name=ud.get("full_name") or email,
                email=email,
                password_hash=get_password_hash(password),
                role=(ud.get("role") or "BIDDER").upper(),
                is_active=True,
                must_change_password=False,
            )
            db.add(user)
            db.flush()
            if (ud.get("role") or "").upper() == "BIDDER":
                bidder_user = user

        # Sample tender + mandatory requirement + pending bid (same stable IDs
        # used by the development seed endpoint).
        tender_id = "GEM/2026/001"
        tender = db.query(Tender).filter(Tender.id == tender_id).first()
        if tender is None:
            tender = Tender(
                id=tender_id,
                title="Procurement of IT Hardware",
                description="Tender for supplying laptops and servers for government office usage.",
                budget_limit=1500000.00,
                status="Active",
            )
            db.add(tender)
            db.flush()
        requirement = db.query(Requirement).filter(
            Requirement.tender_id == tender_id,
            Requirement.code == "GST",
        ).first()
        if requirement is None:
            db.add(
                Requirement(
                    id=uuid.UUID("440e8400-e29b-11d4-a716-446655440000"),
                    tender_id=tender_id,
                    code="GST",
                    description="Valid GST registration certificate document.",
                    is_mandatory=True,
                )
            )
        if bidder_user is not None:
            bid = db.query(Bid).filter(
                Bid.tender_id == tender_id,
                Bid.bidder_id == bidder_user.id,
            ).first()
            if bid is None:
                db.add(
                    Bid(
                        id=uuid.UUID("550e8400-e29b-11d4-a716-446655440000"),
                        tender_id=tender_id,
                        bidder_id=bidder_user.id,
                        status="Pending",
                    )
                )
        db.commit()
    except Exception as exc:  # pragma: no cover - serverless edge case
        db.rollback()
        logging.getLogger("app.vercel").error("Demo bootstrap failed: %s", exc)
    finally:
        db.close()


_bootstrap_demo_data()

__all__ = ["app"]
