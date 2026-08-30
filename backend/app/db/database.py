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

# If we are using SQLite, auto-create tables and apply missing columns so it works out-of-the-box
if is_sqlite:
    try:
        # Import models so they register with Base.metadata
        import app.models
        
        Base.metadata.create_all(bind=engine)
        logger.info("Auto-created model tables in SQLite database.")
        
        # Self-healing migration for SQLite fallback DB schema updates
        with engine.connect() as conn:
            from sqlalchemy import text
            try:
                conn.execute(text("ALTER TABLE audit_logs ADD COLUMN blockchain_hash VARCHAR(64)"))
                conn.commit()
            except Exception:
                pass
    except Exception as create_err:
        logger.error(f"Failed to auto-create tables in SQLite: {create_err}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
