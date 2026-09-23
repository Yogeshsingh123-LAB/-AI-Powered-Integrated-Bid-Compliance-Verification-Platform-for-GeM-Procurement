"""Security hardening: forced password change flag + audit chain sequence.

Revision ID: d3a1b2c4e5f6
Revises: c72f61a9e403
Create Date: 2026-09-23

- users.must_change_password: bootstrapped / admin-created accounts must
  change their password at first login.
- audit_logs.sequence: monotonic append-only sequence number for the
  tamper-evident audit hash chain (assigned under a transaction lock).
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'd3a1b2c4e5f6'
down_revision: Union[str, Sequence[str], None] = 'c72f61a9e403'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("must_change_password", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column("audit_logs", sa.Column("sequence", sa.BigInteger(), nullable=True))
    op.create_index("ix_audit_logs_sequence", "audit_logs", ["sequence"], unique=False)
    op.add_column(
        "documents",
        sa.Column("processing_attempts", sa.Integer(), nullable=False, server_default=sa.text("0")),
    )


def downgrade() -> None:
    op.drop_column("documents", "processing_attempts")
    op.drop_index("ix_audit_logs_sequence", table_name="audit_logs")
    op.drop_column("audit_logs", "sequence")
    op.drop_column("users", "must_change_password")
