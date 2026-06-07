"""Add indexes and optimizations for performance (Feature 32)

Revision ID: 003
Revises: 002
Create Date: 2026-06-07

"""
from alembic import op
import sqlalchemy as sa

revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add indexes for better query performance and caching strategy

    # Workflow indexes for common filtering patterns
    op.create_index('idx_workflow_created_status', 'workflows', ['created_at', 'status'], postgresql_where=sa.text('deleted_at IS NULL'))
    op.create_index('idx_workflow_updated_at', 'workflows', ['updated_at'])

    # Execution indexes for analytics and monitoring
    op.create_index('idx_execution_created_duration', 'executions', ['created_at', 'duration_seconds'])
    op.create_index('idx_execution_started_completed', 'executions', ['started_at', 'completed_at'])
    op.create_index('idx_execution_workflow_created', 'executions', ['workflow_id', 'created_at'])

    # Log indexes for efficient retrieval
    op.create_index('idx_log_execution_timestamp', 'execution_logs', ['execution_id', 'timestamp'])
    op.create_index('idx_log_created', 'execution_logs', ['timestamp'], postgresql_where=sa.text('level IN (\'ERROR\', \'WARN\')'))

    # Trigger indexes
    op.create_index('idx_trigger_created_at', 'triggers', ['created_at'], postgresql_where=sa.text('deleted_at IS NULL'))


def downgrade() -> None:
    op.drop_index('idx_trigger_created_at', table_name='triggers')
    op.drop_index('idx_log_created', table_name='execution_logs')
    op.drop_index('idx_log_execution_timestamp', table_name='execution_logs')
    op.drop_index('idx_execution_workflow_created', table_name='executions')
    op.drop_index('idx_execution_started_completed', table_name='executions')
    op.drop_index('idx_execution_created_duration', table_name='executions')
    op.drop_index('idx_workflow_updated_at', table_name='workflows')
    op.drop_index('idx_workflow_created_status', table_name='workflows')
