"""Read-only database/storage connectivity check; never prints credentials."""
import sys
from sqlalchemy import create_engine, inspect, text
from app.core.config import settings


def main():
    failed = False
    engine = create_engine(settings.DATABASE_URL, connect_args={"connect_timeout": 10})
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        print("Database connection: OK")
        import app.models
        from app.db.database import Base
        inspector = inspect(engine)
        tables = set(inspector.get_table_names())
        missing = []
        for table in Base.metadata.sorted_tables:
            if table.name not in tables:
                missing.append(table.name)
            else:
                existing = {col["name"] for col in inspector.get_columns(table.name)}
                missing.extend(f"{table.name}.{col.name}" for col in table.columns if col.name not in existing)
        print("Database schema: " + ("missing " + ", ".join(missing) if missing else "OK"))
        failed = failed or bool(missing)
    except Exception:
        print("Database check failed: verify network access, DATABASE_URL, and database permissions.")
        failed = True
    finally:
        engine.dispose()
    try:
        from app.services.storage_service import StorageService
        bucket = StorageService.get_client().storage.get_bucket(settings.SUPABASE_BUCKET)
        public = bucket.get("public", False) if isinstance(bucket, dict) else bucket.public
        print("Document storage: " + ("bucket is PUBLIC; make it private" if public else "private bucket OK"))
        failed = failed or public
    except Exception as exc:
        print(f"Storage error category: {type(exc).__name__}; status: {getattr(exc, 'status', 'unknown')}; code: {getattr(exc, 'code', 'unknown')}")
        print("Storage check failed: verify network access, SUPABASE_URL, SUPABASE_SECRET_KEY, and bucket existence.")
        failed = True
    return int(failed)


if __name__ == "__main__":
    sys.exit(main())
