"""Pytest entry points for the P0 audit fixes.

The two end-to-end scenarios must mutate ``os.environ`` *before* the app is
imported (settings are a process-wide singleton), which would poison sibling
test modules if done in-process. They therefore run in a subprocess via
``p0_regression_runner.py``; only the pure-function tests run in-process.
"""

import os
import subprocess
import sys

import pytest

_BACKEND = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
_RUNNER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "p0_regression_runner.py")


def _run_scenario(mode):
    proc = subprocess.run(
        [sys.executable, _RUNNER, "--mode", mode],
        cwd=_BACKEND, capture_output=True, text=True, timeout=600,
    )
    if proc.returncode != 0:
        pytest.fail(
            f"P0 regression ({mode}) failed:\n{proc.stdout}\n{proc.stderr}"
        )
    return proc.stdout


def test_p0_dev_scenario():
    out = _run_scenario("dev")
    assert "ALL CHECKS PASSED" in out


def test_p0_serverless_scenario():
    """The live Vercel configuration: production + no Supabase Storage."""
    out = _run_scenario("serverless")
    assert "ALL CHECKS PASSED" in out


# ---------------------------------------------------------------------------
# Pure-function tests — safe to run in-process
# ---------------------------------------------------------------------------
def test_writer_and_verifier_agree_on_the_payload():
    """Defect 2: the writer's formula and the verifier's formula must match."""
    from datetime import datetime, timezone

    from app.services.audit_chain import (
        GENESIS_HASH,
        canonical_payload,
        compute_block_hash,
        payload_from_record,
    )

    class _FakeLog:
        sequence = 7
        created_at = datetime(2026, 9, 29, 12, 0, 0, 123456, tzinfo=timezone.utc)
        action = "DOCUMENT_UPLOADED"
        user_id = None
        entity_type = "Document"
        entity_id = None
        bid_id = None
        old_value = None
        new_value = "gst_certificate.pdf"
        ip_address = "127.0.0.1"
        blockchain_hash = None

    writer_hash = compute_block_hash(GENESIS_HASH, canonical_payload(
        sequence=7,
        created_at=datetime(2026, 9, 29, 12, 0, 0, 123456, tzinfo=timezone.utc),
        action="DOCUMENT_UPLOADED",
        entity_type="Document",
        new_value="gst_certificate.pdf",
        ip_address="127.0.0.1",
        prev_hash=GENESIS_HASH,
    ))
    verifier_hash = compute_block_hash(
        GENESIS_HASH, payload_from_record(_FakeLog(), GENESIS_HASH))
    assert writer_hash == verifier_hash


def test_naive_and_aware_timestamps_hash_identically():
    """The audit column is naive; the writer is aware. Both must agree."""
    from datetime import datetime, timezone

    from app.services.audit_chain import canonical_payload, serialize_payload

    naive = canonical_payload(sequence=1, created_at=datetime(2026, 1, 1, 0, 0, 0), action="X")
    aware = canonical_payload(
        sequence=1, created_at=datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc), action="X")
    assert serialize_payload(naive) == serialize_payload(aware)


def test_legacy_records_are_not_reported_as_tampered():
    """Rows written by the old v1 verifier must still verify after the fix."""
    import hashlib
    from datetime import datetime

    from app.services.audit_chain import GENESIS_HASH, verify_record

    class _LegacyLog:
        sequence = 3
        created_at = datetime(2026, 9, 1, 9, 0, 0)
        action = "BID_SUBMITTED"
        user_id = None
        entity_type = "Bid"
        entity_id = None
        bid_id = None
        old_value = None
        new_value = "submitted"
        ip_address = None

    # The exact v1 verifier string: prev:action:user:entity:entity_id:bid:new_value
    legacy_hash = hashlib.sha256(
        f"{GENESIS_HASH}:BID_SUBMITTED::Bid:::submitted".encode("utf-8")).hexdigest()

    log = _LegacyLog()
    log.blockchain_hash = legacy_hash
    result = verify_record(log, GENESIS_HASH)
    assert result["integrity_verified"] is True
    assert result["legacy_record"] is True

    # A genuinely altered record must still fail.
    log.new_value = "submitted (tampered)"
    assert verify_record(log, GENESIS_HASH)["integrity_verified"] is False


def test_genesis_hash_is_64_hex_chars():
    from app.services.audit_chain import GENESIS_HASH
    assert len(GENESIS_HASH) == 64
    assert set(GENESIS_HASH) == {"0"}


def test_storage_module_imports_tempfile():
    """Defect 1 (latent): storage_service.get_local_path() raised NameError."""
    import app.services.storage_service as storage_service
    assert hasattr(storage_service, "tempfile")
    assert storage_service.tempfile.gettempdir()


def test_local_backend_is_refused_in_production_without_opt_in(monkeypatch):
    """The production guard must survive the fix — just not fire for durable stores."""
    from app.services.storage_service import StorageService

    monkeypatch.delenv("ALLOW_LOCAL_UPLOADS", raising=False)
    monkeypatch.setattr(StorageService, "_resolved_backend", "local", raising=False)
    monkeypatch.setattr(StorageService, "is_production", classmethod(lambda cls: True))

    with pytest.raises(RuntimeError, match="prohibited in production"):
        StorageService.upload_file(b"data", "x/y.pdf", "application/pdf")


def test_local_backend_allowed_with_explicit_opt_in(monkeypatch, tmp_path):
    monkeypatch.setenv("ALLOW_LOCAL_UPLOADS", "true")
    from app.services.storage_service import StorageService

    monkeypatch.setattr(StorageService, "_resolved_backend", "local", raising=False)
    monkeypatch.setattr(StorageService, "is_production", classmethod(lambda cls: True))
    monkeypatch.setattr(
        StorageService, "get_local_path",
        classmethod(lambda cls, p: str(tmp_path / p.replace("/", "_"))))

    key = StorageService.upload_file(b"hello", "a/b.pdf", "application/pdf")
    assert key == "a/b.pdf"
    assert StorageService.download_file("a/b.pdf") == b"hello"
