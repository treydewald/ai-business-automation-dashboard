"""Add integrations table

Revision ID: 002
Revises: 001
Create Date: 2026-06-07 02:50:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        'integrations',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('credentials', sa.Text(), nullable=False),
        sa.Column('config', sa.JSON(), nullable=True),
        sa.Column('status', sa.Enum('active', 'inactive', 'error', 'testing', name='integrationstatus'), nullable=False),
        sa.Column('last_tested_at', sa.DateTime(), nullable=True),
        sa.Column('last_error', sa.String(500), nullable=True),
        sa.Column('call_count', sa.String(20), nullable=False),
        sa.Column('rate_limit_remaining', sa.String(20), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_integration_type_status', 'integrations', ['type', 'status'])
    op.create_index('idx_integration_created', 'integrations', ['created_at'])
    op.create_index('ix_integrations_type', 'integrations', ['type'])
    op.create_index('ix_integrations_name', 'integrations', ['name'])

def downgrade() -> None:
    op.drop_index('ix_integrations_name', table_name='integrations')
    op.drop_index('ix_integrations_type', table_name='integrations')
    op.drop_index('idx_integration_created', table_name='integrations')
    op.drop_index('idx_integration_type_status', table_name='integrations')
    op.drop_table('integrations')
