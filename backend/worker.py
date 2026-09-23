"""
Durable document-processing worker.

Run as a long-lived process on Render / Railway / Docker (NOT on Vercel, whose
functions are capped at 15s):

    python worker.py            # from the backend/ directory
    # Render: set WORKER_COMMAND=python worker.py in render.yaml (see below)

Responsibilities:
- Claim documents with status UPLOADED (idempotently) and run the OCR /
  extraction / compliance pipeline.
- Retry transient failures up to WORKER_MAX_ATTEMPTS, then park the document
  in PROCESSING_FAILED for manual review (no infinite retry loop).
- Reap documents stuck in intermediate pipeline states for more than
  WORKER_STUCK_MINUTES (e.g. after a crash) and re-queue them.

Add to render.yaml (example):

    services:
      - type: worker
        name: bidzee-doc-worker
        env:
          - key: DATABASE_URL
            fromDatabase:
              name: bidzee-db
              property: connectionString
        buildCommand: cd backend && pip install -r requirements.txt
        startCommand: cd backend && python worker.py
"""
import logging
import os
import signal
import sys
import time
from datetime import datetime, timedelta, timezone
from typing import Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("worker")

_running = True


def _stop(signum, frame):  # noqa: ARG001
    global _running
    logger.info("Signal %s received, shutting down...", signum)
    _running = False


def _now():
    return datetime.now(timezone.utc)


def main() -> int:
    # Ensure the app package is importable when launched from backend/.
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    signal.signal(signal.SIGTERM, _stop)
    signal.signal(signal.SIGINT, _stop)

    from app.core.config import settings
    from app.db.database import initialize_database, SessionLocal
    from app.models.document import Document

    logger.info("Document worker starting (environment=%s)", settings.ENVIRONMENT)
    initialize_database()

    intermediate_states = {"PROCESSING", "TEXT_EXTRACTION", "DOCUMENT_CLASSIFICATION", "FIELD_EXTRACTION", "VALIDATION"}

    while _running:
        try:
            _poll_once(SessionLocal, Document, intermediate_states, settings)
        except Exception as e:
            logger.error("Worker poll cycle failed: %s", e, exc_info=True)
        time.sleep(settings.WORKER_POLL_SECONDS)

    logger.info("Worker stopped.")
    return 0


def _poll_once(SessionLocal, Document, intermediate_states, settings) -> None:
    # 1) Reap stuck documents (crashed mid-pipeline) and re-queue them.
    stuck_before = _now() - timedelta(minutes=settings.WORKER_STUCK_MINUTES)
    with SessionLocal() as db:
        stuck = (
            db.query(Document)
            .filter(Document.document_status.in_(intermediate_states))
            .filter(Document.updated_at < stuck_before)
            .all()
        )
        for doc in stuck:
            doc.document_status = "UPLOADED"
            db.commit()
            logger.warning("Document %s stuck in pipeline, re-queued (attempts=%s)", doc.id, doc.processing_attempts)

    # 2) Claim pending documents.
    while _running:
        with SessionLocal() as db:
            doc = (
                db.query(Document)
                .filter(Document.document_status == "UPLOADED")
                .order_by(Document.uploaded_at.asc())
                .first()
            )
            if doc is None:
                return
            doc_id = doc.id
            attempts = (doc.processing_attempts or 0) + 1
            doc.processing_attempts = attempts
            db.commit()
            logger.info("Processing document %s (attempt %s/%s)", doc_id, attempts, settings.WORKER_MAX_ATTEMPTS)

        from app.services.document_processing_service import process_document_background
        try:
            process_document_background(doc_id)
        except Exception as e:
            logger.error("Worker processing failed for %s: %s", doc_id, e, exc_info=True)
            _mark_failed_if_exhausted(doc_id, settings.WORKER_MAX_ATTEMPTS)


def _mark_failed_if_exhausted(document_id, max_attempts: int) -> None:
    """If the pipeline failed and attempts are exhausted, park the document
    in PROCESSING_FAILED so it is visible for manual review."""
    from app.db.database import SessionLocal
    from app.models.document import Document
    with SessionLocal() as db:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc is None:
            return
        if (doc.processing_attempts or 0) >= max_attempts and doc.document_status not in ("PROCESSED", "REQUIRES_REVIEW"):
            doc.document_status = "PROCESSING_FAILED"
            doc.rejection_reason = f"Processing failed after {doc.processing_attempts} attempts; manual review required."
            db.commit()
            logger.error("Document %s marked PROCESSING_FAILED after %s attempts", document_id, doc.processing_attempts)


if __name__ == "__main__":
    raise SystemExit(main())
