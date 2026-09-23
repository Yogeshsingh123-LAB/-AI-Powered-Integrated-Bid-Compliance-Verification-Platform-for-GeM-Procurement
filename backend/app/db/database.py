import logging
# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()


def create_resilient_engine(url: str):
    is_sqlite = url.startswith("sqlite")
    if is_sqlite:
        return create_engine(url, connect_args={"check_same_thread": False}, pool_pre_ping=True)

    clean_url = url
    if clean_url.startswith("postgres://"):
        clean_url = "postgresql://" + clean_url[len("postgres://"):]

    drivers_to_try = [clean_url]
    if "postgresql+psycopg2://" in clean_url:
        drivers_to_try.extend([
            clean_url.replace("postgresql+psycopg2://", "postgresql://", 1),
            clean_url.replace("postgresql+psycopg2://", "postgresql+psycopg://", 1)
        ])
    elif "postgresql+psycopg://" in clean_url:
        drivers_to_try.extend([
            clean_url.replace("postgresql+psycopg://", "postgresql://", 1),
            clean_url.replace("postgresql+psycopg://", "postgresql+psycopg2://", 1)
        ])
    elif clean_url.startswith("postgresql://"):
        drivers_to_try.extend([
            clean_url.replace("postgresql://", "postgresql+psycopg2://", 1),
            clean_url.replace("postgresql://", "postgresql+psycopg://", 1)
        ])

    last_error = None
    for target_url in drivers_to_try:
        try:
            eng = create_engine(
                target_url,
                connect_args={"connect_timeout": 10},
                pool_size=10,
                max_overflow=20,
                pool_timeout=30,
                pool_recycle=1800,
                pool_pre_ping=True
            )
            with eng.connect() as conn:
                from sqlalchemy import text
                conn.execute(text("SELECT 1"))
            logger.info("Successfully established pooled PostgreSQL connection.")
            return eng
        except Exception as e:
            logger.warning(f"Engine connection attempt failed with driver URL: {e}")
            last_error = e

    if last_error:
        raise last_error


import os

# Production includes real serverless/PaaS runtimes: SQLite fallback is never
# allowed there because their local disk is ephemeral (data loss, per-instance
# databases, re-created default accounts).
is_production = settings.is_production or settings.is_cloud

# --- Engine creation: fail closed in production -----------------------------
# Demo opt-in: a serverless demo deployment (e.g. the public Vercel demo) may
# explicitly set ALLOW_EPHEMERAL_SQLITE=true to run on the runtime's writable
# temp directory. Demo data is re-provisioned on every cold start by the
# deployment bootstrap; every non-demo deployment still fails closed.
_allow_ephemeral_sqlite = os.environ.get("ALLOW_EPHEMERAL_SQLITE", "").strip().lower() == "true"

db_url = settings.DATABASE_URL
if not db_url:
    if is_production and not _allow_ephemeral_sqlite:
        raise RuntimeError(
            "DATABASE_URL is not configured and the environment is "
            f"'{settings.ENVIRONMENT}' (production/cloud). A persistent database "
            "URL is mandatory; the SQLite fallback is disabled in production."
        )
    if is_production and _allow_ephemeral_sqlite:
        logger.warning(
            "ALLOW_EPHEMERAL_SQLITE=true: running on the ephemeral temp-directory "
            "database (demo deployment). Data is re-created on every cold start."
        )
    dev_db_path = os.path.join(settings.safe_upload_dir, "bid_compliance_persistent.db")
    db_url = f"sqlite:///{dev_db_path}"

try:
    if db_url.startswith("sqlite"):
        engine = create_engine(db_url, connect_args={"check_same_thread": False}, pool_pre_ping=True)
    else:
        engine = create_resilient_engine(db_url)
except Exception as err:
    if is_production and not _allow_ephemeral_sqlite:
        logger.error(f"Production database engine initialization failed: {err}")
        raise RuntimeError(
            "Database engine initialization failed and the SQLite fallback is "
            "prohibited in production. Fix DATABASE_URL / connectivity and restart."
        ) from err
    dev_db_path = os.path.join(settings.safe_upload_dir, "bid_compliance_persistent.db")
    logger.warning(f"Could not initialize primary database engine ({err}); falling back to local SQLite database at {dev_db_path}.")
    engine = create_engine(f"sqlite:///{dev_db_path}", connect_args={"check_same_thread": False}, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def apply_schema_migrations():
    """Self-healing migration: Ensure all tables, columns, and indexes exist in PostgreSQL or SQLite.

    NOTE: This is a compatibility shim for existing deployments. New schema
    changes should be shipped as Alembic migrations (see backend/alembic) run
    as a separate deployment step; this function only back-fills columns that
    legacy databases may be missing.
    """
    try:
        import app.models  # Ensure models register with Base.metadata
        Base.metadata.create_all(bind=engine)

        from sqlalchemy import text, inspect
        inspector = inspect(engine)

        if "users" in inspector.get_table_names():
            existing_user_cols = [c["name"] for c in inspector.get_columns("users")]
            user_columns = [
                ("department", "VARCHAR(100) DEFAULT 'Procurement'"),
                ("status", "VARCHAR(20) DEFAULT 'Active'"),
                ("permissions", "VARCHAR(500)"),
                ("last_login", "TIMESTAMP WITH TIME ZONE" if engine.dialect.name != "sqlite" else "DATETIME"),
                ("auth_user_id", "VARCHAR(100)"),
                ("must_change_password", "BOOLEAN NOT NULL DEFAULT FALSE" if engine.dialect.name != "sqlite" else "BOOLEAN DEFAULT 0"),
            ]
            for col_name, col_type in user_columns:
                if col_name not in existing_user_cols:
                    try:
                        with engine.begin() as ddl_conn:
                            ddl_conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                    except Exception as e:
                        logger.warning(f"Failed to add column {col_name} to users: {e}")

        if "audit_logs" in inspector.get_table_names():
            existing_audit_cols = [c["name"] for c in inspector.get_columns("audit_logs")]
            if "blockchain_hash" not in existing_audit_cols:
                try:
                    with engine.begin() as ddl_conn:
                        ddl_conn.execute(text("ALTER TABLE audit_logs ADD COLUMN blockchain_hash VARCHAR(64)"))
                except Exception as e:
                    logger.warning(f"Failed to add column blockchain_hash to audit_logs: {e}")
            if "sequence" not in existing_audit_cols:
                try:
                    with engine.begin() as ddl_conn:
                        ddl_conn.execute(text("ALTER TABLE audit_logs ADD COLUMN sequence BIGINT"))
                except Exception as e:
                    logger.warning(f"Failed to add column sequence to audit_logs: {e}")

        # Tender columns self-healing migrations
        if "tenders" in inspector.get_table_names():
            existing_tender_cols = [c["name"] for c in inspector.get_columns("tenders")]
            tender_columns = [
                ("description", "TEXT"),
                ("category", "VARCHAR(100) DEFAULT 'General Procurement'"),
                ("department", "VARCHAR(255) DEFAULT 'Chennai Petroleum Corporation Limited (CPCL)'"),
                ("tender_type", "VARCHAR(100) DEFAULT 'Custom Bid'"),
                ("budget_limit", "NUMERIC(15, 2) DEFAULT 5000000.0"),
                ("status", "VARCHAR(50) DEFAULT 'Draft'"),
                ("eligibility_requirements", "TEXT"),
                ("custom_rules", "JSONB" if engine.dialect.name != "sqlite" else "JSON"),
                ("scoring_weights", "JSONB" if engine.dialect.name != "sqlite" else "JSON"),
                ("created_by", "UUID" if engine.dialect.name != "sqlite" else "VARCHAR(36)"),
                ("created_at", "TIMESTAMP WITH TIME ZONE" if engine.dialect.name != "sqlite" else "DATETIME"),
                ("published_at", "TIMESTAMP WITH TIME ZONE" if engine.dialect.name != "sqlite" else "DATETIME"),
                ("closing_date", "TIMESTAMP WITH TIME ZONE" if engine.dialect.name != "sqlite" else "DATETIME")
            ]

            for col_name, col_type in tender_columns:
                if col_name not in existing_tender_cols:
                    try:
                        with engine.begin() as ddl_conn:
                            ddl_conn.execute(text(f"ALTER TABLE tenders ADD COLUMN {col_name} {col_type}"))
                    except Exception as e:
                        logger.warning(f"Failed to add column {col_name} to tenders: {e}")

        if "bids" in inspector.get_table_names():
            existing_bid_cols = [c["name"] for c in inspector.get_columns("bids")]
            bid_columns = [
                ("compliance_score", "NUMERIC(5, 2) DEFAULT 0.0"),
                ("status", "VARCHAR(50) DEFAULT 'Pending'"),
                ("is_locked", "BOOLEAN DEFAULT FALSE"),
                ("submitted_at", "TIMESTAMP WITH TIME ZONE" if engine.dialect.name != "sqlite" else "DATETIME"),
                ("officer_status", "VARCHAR(50) DEFAULT 'Pending'"),
                ("deviation_justification", "TEXT"),
                ("deviation_category", "VARCHAR(100)"),
                ("officer_id", "UUID" if engine.dialect.name != "sqlite" else "VARCHAR(36)"),
                ("reviewed_at", "TIMESTAMP WITH TIME ZONE" if engine.dialect.name != "sqlite" else "DATETIME")
            ]

            for col_name, col_type in bid_columns:
                if col_name not in existing_bid_cols:
                    try:
                        with engine.begin() as ddl_conn:
                            ddl_conn.execute(text(f"ALTER TABLE bids ADD COLUMN {col_name} {col_type}"))
                    except Exception as e:
                        logger.warning(f"Failed to add column {col_name} to bids: {e}")

        if "documents" in inspector.get_table_names():
            existing_doc_cols = [c["name"] for c in inspector.get_columns("documents")]
            if "rejection_reason" not in existing_doc_cols:
                try:
                    with engine.begin() as ddl_conn:
                        ddl_conn.execute(text("ALTER TABLE documents ADD COLUMN rejection_reason TEXT"))
                except Exception as e:
                    logger.warning(f"Failed to add column rejection_reason to documents: {e}")
            if "processing_attempts" not in existing_doc_cols:
                try:
                    with engine.begin() as ddl_conn:
                        ddl_conn.execute(text("ALTER TABLE documents ADD COLUMN processing_attempts INTEGER NOT NULL DEFAULT 0"))
                except Exception as e:
                    logger.warning(f"Failed to add column processing_attempts to documents: {e}")

        # Ensure performance indexes exist
        if engine.dialect.name != "sqlite":
            index_statements = [
                "CREATE INDEX IF NOT EXISTS idx_bids_tender_id ON bids(tender_id)",
                "CREATE INDEX IF NOT EXISTS idx_bids_bidder_id ON bids(bidder_id)",
                "CREATE INDEX IF NOT EXISTS idx_bids_status ON bids(status)",
                "CREATE INDEX IF NOT EXISTS idx_bids_officer_status ON bids(officer_status)",
                "CREATE INDEX IF NOT EXISTS idx_bids_compliance_score ON bids(compliance_score)",
                "CREATE INDEX IF NOT EXISTS idx_bids_submitted_at ON bids(submitted_at DESC)",
                "CREATE INDEX IF NOT EXISTS idx_tenders_status ON tenders(status)",
                "CREATE INDEX IF NOT EXISTS idx_tenders_created_by ON tenders(created_by)",
                "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
                "CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)"
            ]
            for idx_sql in index_statements:
                try:
                    with engine.begin() as ddl_conn:
                        ddl_conn.execute(text(idx_sql))
                except Exception as idx_err:
                    logger.warning(f"Note on index creation statement '{idx_sql}': {idx_err}")

        logger.info("Schema migrations and performance indexes applied successfully.")
    except Exception as create_err:
        raise RuntimeError("Database schema initialization failed. Check database permissions and migrations.") from None


def bootstrap_accounts():
    """
    Bootstrap privileged accounts. SECURITY: no hardcoded credentials exist.

    - The first ADMIN is created only from INITIAL_ADMIN_EMAIL /
      INITIAL_ADMIN_PASSWORD supplied through the environment. The account is
      flagged must_change_password so the credential must be rotated at first
      login.
    - In production the initial password must be strong and is checked against
      a list of common/demo passwords.
    - In production, if there is no active ADMIN after bootstrapping, startup
      FAILS (a production system must have an administrator).
    - No demo accounts are seeded at startup (no default credentials exist in
      the source). For isolated development, create labelled dev accounts via
      the gated POST /auth/seed endpoint (ALLOW_SEED_ENDPOINT=true), which
      generates one-time passwords and flags must_change_password.
    """
    from app.models.user import User
    from app.core.security import get_password_hash, is_weak_or_demo_password

    with SessionLocal() as db:
        user_count = db.query(User).count()
        admin_count = db.query(User).filter(User.role == "ADMIN", User.is_active == True).count()  # noqa: E712

        # --- Initial admin from environment (dev and production) ---
        if user_count == 0 and settings.INITIAL_ADMIN_EMAIL and settings.INITIAL_ADMIN_PASSWORD:
            password = settings.INITIAL_ADMIN_PASSWORD
            if settings.is_production and is_weak_or_demo_password(password):
                raise RuntimeError(
                    "INITIAL_ADMIN_PASSWORD is a common/demo password and is not "
                    "accepted in production. Set a strong unique password via environment."
                )
            db.add(User(
                full_name="Platform Administrator",
                email=settings.INITIAL_ADMIN_EMAIL.lower(),
                password_hash=get_password_hash(password),
                role="ADMIN",
                status="Active",
                department="Procurement",
                is_active=True,
                must_change_password=True,
            ))
            db.commit()
            logger.info("Bootstrapped initial administrator account (password change required at first login).")

        # --- Production must always have an active administrator ---
        if settings.is_production:
            final_admin_count = db.query(User).filter(User.role == "ADMIN", User.is_active == True).count()  # noqa: E712
            if final_admin_count == 0:
                raise RuntimeError(
                    "No active ADMIN account exists and no INITIAL_ADMIN_EMAIL/"
                    "INITIAL_ADMIN_PASSWORD was provided. Refusing to start a "
                    "production system without an administrator."
                )
        elif user_count == 0 and not (settings.INITIAL_ADMIN_EMAIL and settings.INITIAL_ADMIN_PASSWORD):
            logger.info(
                "No users exist and no INITIAL_ADMIN_* credentials were provided. "
                "Create an administrator via /auth/seed (development) or set "
                "INITIAL_ADMIN_EMAIL / INITIAL_ADMIN_PASSWORD."
            )


# Kept for backwards compatibility with existing scripts; delegates to the
# environment-driven bootstrap.
def init_admin_user():
    bootstrap_accounts()


def create_fallback_engine():
    """Development-only fallback. Never invoked in production (guarded at call sites)."""
    global engine, SessionLocal
    if is_production:
        raise RuntimeError("SQLite fallback engine is prohibited in production.")
    dev_db_path = os.path.join(settings.safe_upload_dir, "bid_compliance_persistent.db")
    fallback_url = f"sqlite:///{dev_db_path}"
    logger.info(f"Initializing fallback SQLite database at {fallback_url}")
    engine = create_engine(fallback_url, connect_args={"check_same_thread": False}, pool_pre_ping=True)
    SessionLocal.configure(bind=engine)
    try:
        import app.models
        Base.metadata.create_all(bind=engine)
    except Exception as m_err:
        logger.warning(f"Fallback create_all warning: {m_err}")
    return engine


def initialize_database():
    """
    Application startup database initialization.

    Fail-closed: in production every step that cannot be completed raises and
    stops startup. In development, non-fatal problems are logged as warnings.
    """
    try:
        with engine.connect() as connection:
            from sqlalchemy import text
            connection.execute(text("SELECT 1"))
    except Exception as exc:
        if is_production:
            logger.error(f"Production database connection check failed: {exc}")
            raise RuntimeError(f"Production database connection failed: {exc}. Ephemeral SQLite fallback is prohibited in production.") from exc
        logger.warning(f"Development database connection warning ({exc}); initializing development SQLite engine.")
        try:
            create_fallback_engine()
        except Exception as fb_err:
            logger.error(f"Fallback engine creation error: {fb_err}")

    try:
        apply_schema_migrations()
        bootstrap_accounts()
        if settings.is_demo_only and settings.SEED_DEMO_ACCOUNTS:
            seed_initial_tenders()
    except Exception as exc:
        if is_production:
            logger.error(f"Database initialization failed in production: {exc}")
            raise
        logger.warning(f"Database schema initialization check warning: {exc}")


def seed_initial_tenders():
    """Seed realistic initial procurement tenders into the database when empty.
    Development/demo-only: production databases must receive tenders through
    the officer workflow, not startup seeding."""
    from datetime import datetime, timezone, timedelta
    from app.models.tender import Tender
    from app.models.user import User

    with SessionLocal() as db:
        try:
            count = db.query(Tender).count()
            if count > 0:
                return

            admin_user = db.query(User).filter(User.role == "ADMIN").first()
            admin_id = admin_user.id if admin_user else None

            sample_tenders = [
                Tender(
                    id="GEM/2026/T-1001",
                    title="Supply, Installation & Commissioning of High-Performance Enterprise Servers",
                    description="Procurement of rack-mountable server nodes, NVMe storage arrays, and redundant power units for GeM Central Data Facility.",
                    category="IT Infrastructure & Servers",
                    department="Chennai Petroleum Corporation Limited (CPCL)",
                    tender_type="Open Tender / Custom Bid",
                    budget_limit=12500000.0,
                    status="Active",
                    eligibility_requirements="GST Registration, PAN Card, Udyam MSME Certificate, OEM Authorization Certificate, Make in India Declaration",
                    created_by=admin_id,
                    published_at=datetime.now(timezone.utc),
                    closing_date=datetime.now(timezone.utc) + timedelta(days=30)
                ),
                Tender(
                    id="GEM/2026/T-1002",
                    title="Enterprise Cybersecurity Audit & Penetration Testing Services",
                    description="Comprehensive vulnerability assessment, penetration testing (VAPT), and ISO 27001 compliance audit for procurement portals.",
                    category="Consulting & Security Services",
                    department="Ministry of Electronics & Information Technology (MeitY)",
                    tender_type="QCBS / Custom Bid",
                    budget_limit=4500000.0,
                    status="Active",
                    eligibility_requirements="GST Registration, PAN Card, CERT-In Empanelled Auditor Certificate, Cybersecurity Past Experience",
                    created_by=admin_id,
                    published_at=datetime.now(timezone.utc),
                    closing_date=datetime.now(timezone.utc) + timedelta(days=21)
                ),
                Tender(
                    id="GEM/2026/T-1003",
                    title="Procurement of Commercial Laptops & Mobile Workstations",
                    description="Supply of 250 Intel Core i7 13th Gen commercial laptops with 3-year onsite OEM warranty for regional procurement offices.",
                    category="Computer Hardware",
                    department="Directorate General of Supplies & Disposals (DGS&D)",
                    tender_type="Custom Bid",
                    budget_limit=18000000.0,
                    status="Active",
                    eligibility_requirements="GST Registration, PAN Card, Udyam MSME Certificate, OEM Authorization Certificate, Class-1 Local Content (MII)",
                    created_by=admin_id,
                    published_at=datetime.now(timezone.utc),
                    closing_date=datetime.now(timezone.utc) + timedelta(days=15)
                )
            ]
            db.add_all(sample_tenders)
            db.commit()
            logger.info("Successfully seeded initial sample tenders (development/demo mode).")
        except Exception as err:
            logger.warning(f"Note on initial tender seeding: {err}")
            db.rollback()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
