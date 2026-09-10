"""Add isolated support and abuse-control tables.

Revision ID: c72f61a9e403
Revises: f81a3e8289fc
"""
from alembic import op
import sqlalchemy as sa

revision = "c72f61a9e403"
down_revision = "f81a3e8289fc"
branch_labels = None
depends_on = None


def upgrade():
    # Match startup-created installations without coupling this revision to future ORM changes.
    existing = set(sa.inspect(op.get_bind()).get_table_names())
    if "chat_rate_limits" not in existing:
        op.create_table("chat_rate_limits",
                        sa.Column("user_id", sa.UUID(), sa.ForeignKey("users.id"), primary_key=True),
                        sa.Column("scope", sa.String(20), primary_key=True),
                        sa.Column("window", sa.Integer(), nullable=False),
                        sa.Column("count", sa.Integer(), nullable=False))
    if "support_tickets" not in existing:
        op.create_table("support_tickets",
                        sa.Column("id", sa.UUID(), primary_key=True),
                        sa.Column("owner_id", sa.UUID(), sa.ForeignKey("users.id"), nullable=False),
                        sa.Column("application_id", sa.UUID(), sa.ForeignKey("bids.id")),
                        sa.Column("subject", sa.String(160), nullable=False),
                        sa.Column("status", sa.String(30), nullable=False),
                        sa.Column("escalated_at", sa.DateTime(timezone=True)),
                        sa.Column("agent_id", sa.UUID(), sa.ForeignKey("users.id")),
                        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
                        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False))
        op.create_index("ix_support_tickets_owner_id", "support_tickets", ["owner_id"])
    if "support_messages" not in existing:
        op.create_table("support_messages",
                        sa.Column("id", sa.UUID(), primary_key=True),
                        sa.Column("ticket_id", sa.UUID(), sa.ForeignKey("support_tickets.id"), nullable=False),
                        sa.Column("sender_id", sa.UUID(), sa.ForeignKey("users.id"), nullable=False),
                        sa.Column("sender_kind", sa.String(20), nullable=False),
                        sa.Column("content", sa.Text(), nullable=False),
                        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False))
        op.create_index("ix_support_messages_ticket_id", "support_messages", ["ticket_id"])
    if "support_presence" not in existing:
        op.create_table("support_presence",
                        sa.Column("user_id", sa.UUID(), sa.ForeignKey("users.id"), primary_key=True),
                        sa.Column("seen_at", sa.DateTime(timezone=True), nullable=False))


def downgrade():
    existing = set(sa.inspect(op.get_bind()).get_table_names())
    for name in ("support_presence", "support_messages", "support_tickets", "chat_rate_limits"):
        if name in existing:
            op.drop_table(name)
