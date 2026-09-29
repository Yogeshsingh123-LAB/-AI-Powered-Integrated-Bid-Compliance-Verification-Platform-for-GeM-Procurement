"""add document_blobs table for durable document byte storage

Revision ID: b7c1e4a9f2d3
Revises: d3a1b2c4e5f6
Create Date: 2026-09-29 16:05:00.000000

Serverless runtimes (Vercel, Lambda, Render, Railway) have no writable
persistent filesystem, so ``StorageService`` refused every upload when
Supabase Storage was not configured. This table lets the ``db`` backend keep
uploaded bidder documents in the durable PostgreSQL database instead.

The table is also created idempotently by
``app.db.database.apply_schema_migrations()`` (``Base.metadata.create_all``),
so this migration is a no-op on databases that already ran the shim.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7c1e4a9f2d3'
down_revision: Union[str, Sequence[str], None] = 'd3a1b2c4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if 'document_blobs' in inspector.get_table_names():
        return

    op.create_table(
        'document_blobs',
        sa.Column('storage_path', sa.String(length=512), nullable=False),
        sa.Column('file_data', sa.LargeBinary(), nullable=False),
        sa.Column('mime_type', sa.String(length=100), nullable=True),
        sa.Column('file_size', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('storage_path'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('document_blobs')
