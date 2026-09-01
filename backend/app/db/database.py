import logging
# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()

# Try connecting to PostgreSQL; fall back to SQLite if unreachable or connection fails.
is_sqlite = False
try:
    logger.info(f"Connecting to database: {settings.DATABASE_URL}")
    connect_args = {}
    if "postgresql" in settings.DATABASE_URL:
        connect_args["connect_timeout"] = 3
    engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
    with engine.connect() as conn:
        pass
    logger.info("Database connection to PostgreSQL successful.")
except Exception as e:
    logger.warning(
        f"PostgreSQL database connection failed ({e}). "
        "Falling back to local SQLite database: sqlite:///./bid_compliance.db"
    )
    sqlite_url = "sqlite:///./bid_compliance.db"
    engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
    is_sqlite = True

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def apply_schema_migrations():
    """Self-healing migration: Ensure all tables and columns exist in PostgreSQL or SQLite."""
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

        logger.info("Schema migrations applied successfully.")
    except Exception as create_err:
        logger.error(f"Failed to apply database migrations: {create_err}")

# Auto-apply migrations when database module loads
try:
    apply_schema_migrations()
except Exception as err:
    logger.warning(f"Database migration load error: {err}")

def init_admin_user():
    """Ensure that ONLY the primary platform Admin user (admin@gem.gov.in) exists in the initial database."""
    db = SessionLocal()
    try:
        from app.models.user import User
        from app.core.security import get_password_hash
        
        admin_email = "admin@gem.gov.in"
        existing_admin = db.query(User).filter(User.email.ilike(admin_email)).first()
        if not existing_admin:
            # Check if any admin exists
            existing_admin = db.query(User).filter(User.role == "ADMIN").first()
            
        if not existing_admin:
            logger.info("Initializing primary Admin user account...")
            admin_user = User(
                full_name="Platform Administrator",
                email=admin_email,
                password_hash=get_password_hash("Admin@123"),
                role="ADMIN",
                status="Active",
                department="Procurement",
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            logger.info("Primary Admin user (admin@gem.gov.in) initialized successfully.")
        else:
            # Ensure email and active status are correct
            existing_admin.email = admin_email
            existing_admin.is_active = True
            existing_admin.role = "ADMIN"
            if not existing_admin.status:
                existing_admin.status = "Active"
            if not existing_admin.department:
                existing_admin.department = "Procurement"
            db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to initialize primary admin user: {e}")
    finally:
        db.close()

# Auto-run admin init when database module is loaded
try:
    init_admin_user()
except Exception:
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

