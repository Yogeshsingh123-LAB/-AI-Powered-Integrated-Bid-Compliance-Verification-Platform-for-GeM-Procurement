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

is_production = settings.ENVIRONMENT.lower() in ("production", "prod", "staging") or bool(
    os.environ.get("VERCEL") or os.environ.get("VERCEL_ENV") or os.environ.get("RENDER") or os.environ.get("RAILWAY_ENVIRONMENT") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME")
)

try:
    db_url = settings.DATABASE_URL
    if not db_url:
        if is_production:
            raise RuntimeError("DATABASE_URL environment variable is required in production environment.")
        dev_db_path = os.path.join(settings.safe_upload_dir, "bid_compliance_persistent.db")
        db_url = f"sqlite:///{dev_db_path}"

    if db_url.startswith("sqlite"):
        engine = create_engine(db_url, connect_args={"check_same_thread": False}, pool_pre_ping=True)
    else:
        engine = create_resilient_engine(db_url)
except Exception as err:
    if is_production:
        logger.error(f"Could not connect to production primary database: {err}")
        raise RuntimeError(f"Could not connect to production database: {err}. Silent database fallback is prohibited in production.") from err
    dev_db_path = os.path.join(settings.safe_upload_dir, "bid_compliance_persistent.db")
    logger.warning(f"Could not initialize primary database engine: {err}. Using persistent local database at {dev_db_path}.")
    engine = create_engine(f"sqlite:///{dev_db_path}", connect_args={"check_same_thread": False}, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def apply_schema_migrations():
    """Self-healing migration: Ensure all tables, columns, and indexes exist in PostgreSQL or SQLite."""
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
                ("auth_user_id", "VARCHAR(100)")
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

def init_admin_user():
    """Bootstrap an admin once; never rename, reactivate or promote existing users."""
    from app.models.user import User
    from app.core.security import get_password_hash, validate_password_strength, verify_password

    with SessionLocal() as db:
        existing_admin = db.query(User).filter(User.role == "ADMIN").first()
        if existing_admin:
            if settings.ENVIRONMENT.lower() == "production" and any(
                verify_password(password, existing_admin.password_hash)
                for password in ("Admin@123", "AdminPassword123", "admin123", "admin", "Admin123", "officer123")
            ):
                logger.warning("Existing administrator is using default password; please change in production.")
            return
        password = settings.INITIAL_ADMIN_PASSWORD or "AdminSecret2026!"
        if not validate_password_strength(password):
            password = "AdminSecret2026!"
        email = (settings.INITIAL_ADMIN_EMAIL or "admin@gem.gov.in").strip().lower()
        if db.query(User).filter(User.email.ilike(email)).first():
            logger.warning(f"INITIAL_ADMIN_EMAIL {email} already belongs to an existing account. Skipping admin bootstrap.")
            return
        db.add(User(
            full_name="Platform Administrator", email=email,
            password_hash=get_password_hash(password), role="ADMIN",
            status="Active", department="Procurement", is_active=True,
        ))
        db.commit()


def create_fallback_engine():
    global engine, SessionLocal
    import os
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
    global engine
    is_prod = settings.ENVIRONMENT.lower() == "production" or os.environ.get("VERCEL") == "1"
    try:
        with engine.connect() as connection:
            from sqlalchemy import text
            connection.execute(text("SELECT 1"))
    except Exception as exc:
        if is_prod:
            logger.error(f"Production database connection check failed: {exc}")
            raise RuntimeError(f"Production database connection failed: {exc}. Ephemeral SQLite fallback is prohibited in production.") from exc
        logger.warning(f"Development database connection warning ({exc}); initializing development SQLite engine.")
        try:
            create_fallback_engine()
        except Exception as fb_err:
            logger.error(f"Fallback engine creation error: {fb_err}")

    try:
        apply_schema_migrations()
        init_admin_user()
        seed_initial_tenders()
    except Exception as exc:
        logger.warning(f"Database schema initialization check warning: {exc}")


def seed_initial_tenders():
    """Seed realistic initial procurement tenders into database if empty."""
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
            logger.info("Successfully seeded initial sample tenders into PostgreSQL database.")
        except Exception as err:
            logger.warning(f"Note on initial tender seeding: {err}")
            db.rollback()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

