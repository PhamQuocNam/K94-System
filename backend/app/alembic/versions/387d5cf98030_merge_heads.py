"""merge_heads

Revision ID: 387d5cf98030
Revises: fe56fa70289e, 20250605_phase1
Create Date: 2026-06-05 19:52:53.395154

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '387d5cf98030'
down_revision = ('fe56fa70289e', '20250605_phase1')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
