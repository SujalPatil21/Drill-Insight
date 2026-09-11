"""add engineers table for auth

Revision ID: a1b2c3d4e5f6
Revises: 767ce951bcf1
Create Date: 2026-09-11

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '767ce951bcf1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'engineers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_engineers_id'), 'engineers', ['id'], unique=False)
    op.create_index(op.f('ix_engineers_username'), 'engineers', ['username'], unique=True)
    op.create_index(op.f('ix_engineers_email'), 'engineers', ['email'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_engineers_email'), table_name='engineers')
    op.drop_index(op.f('ix_engineers_username'), table_name='engineers')
    op.drop_index(op.f('ix_engineers_id'), table_name='engineers')
    op.drop_table('engineers')
