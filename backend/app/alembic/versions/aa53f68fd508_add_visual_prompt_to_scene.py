"""add_visual_prompt_to_scene

Revision ID: aa53f68fd508
Revises: 5fde2b6b03ce
Create Date: 2026-06-13 01:38:36.010855

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = 'aa53f68fd508'
down_revision = '5fde2b6b03ce'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('scene', sa.Column('visual_prompt', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('scene', 'visual_prompt')
