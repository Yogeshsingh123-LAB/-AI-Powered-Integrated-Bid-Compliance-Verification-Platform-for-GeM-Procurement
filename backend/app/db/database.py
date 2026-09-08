import logging
# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()

# Constructing the engine must not connect, migrate, or create accounts at import.
# Startup owns those actions, which also makes isolated tests possible.
is_sqlite = settings.DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {"connect_timeout": 10}
engine = create_engine(settings.DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)

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
                raise RuntimeError("Change the existing administrator's default password before production startup.")
            return
        password = settings.INITIAL_ADMIN_PASSWORD
        if not password:
            raise RuntimeError("Set INITIAL_ADMIN_PASSWORD to bootstrap the first administrator.")
        if not validate_password_strength(password) or password in {"Admin@123", "AdminPassword123"}:
            raise RuntimeError("INITIAL_ADMIN_PASSWORD must be a strong, non-default password.")
        email = settings.INITIAL_ADMIN_EMAIL.strip().lower()
        if db.query(User).filter(User.email.ilike(email)).first():
            raise RuntimeError("INITIAL_ADMIN_EMAIL already belongs to a non-admin account. Choose another address.")
        db.add(User(
            full_name="Platform Administrator", email=email,
            password_hash=get_password_hash(password), role="ADMIN",
            status="Active", department="Procurement", is_active=True,
        ))
        db.commit()


def initialize_database():
    try:
        with engine.connect() as connection:
            from sqlalchemy import text
            connection.execute(text("SELECT 1"))
    except Exception:
        # Driver errors and connection URIs can contain credentials.
        raise RuntimeError("Database connection failed. Check DATABASE_URL and database availability.") from None
    apply_schema_migrations()
    init_admin_user()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

