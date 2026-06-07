"""Initial schema creation for workflows, executions, and triggers

Revision ID: 001
Revises:
Create Date: 2026-06-07 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        'workflows',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('definition', sa.JSON(), nullable=False),
        sa.Column('status', sa.Enum('active', 'inactive', 'archived', name='workflowstatus'), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_workflow_status_created', 'workflows', ['status', 'created_at'])
    op.create_index('ix_workflows_name', 'workflows', ['name'])
    op.create_index('ix_workflows_status', 'workflows', ['status'])

    op.create_table(
        'executions',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('workflow_id', sa.String(36), nullable=False),
        sa.Column('status', sa.Enum('pending', 'running', 'completed', 'failed', 'retrying', name='executionstatus'), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('result', sa.JSON(), nullable=True),
        sa.Column('context', sa.JSON(), nullable=True),
        sa.Column('error_message', sa.String(1000), nullable=True),
        sa.Column('retry_count', sa.String(10), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('duration_seconds', sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(['workflow_id'], ['workflows.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_execution_workflow_status', 'executions', ['workflow_id', 'status'])
    op.create_index('idx_execution_status_created', 'executions', ['status', 'created_at'])
    op.create_index('ix_executions_workflow_id', 'executions', ['workflow_id'])
    op.create_index('ix_executions_status', 'executions', ['status'])

    op.create_table(
        'execution_logs',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('execution_id', sa.String(36), nullable=False),
        sa.Column('step_name', sa.String(255), nullable=False),
        sa.Column('level', sa.Enum('DEBUG', 'INFO', 'WARN', 'ERROR', name='loglevel'), nullable=False),
        sa.Column('message', sa.String(2000), nullable=False),
        sa.Column('context_json', sa.JSON(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['execution_id'], ['executions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_log_execution_step', 'execution_logs', ['execution_id', 'step_name'])
    op.create_index('idx_log_execution_level', 'execution_logs', ['execution_id', 'level'])
    op.create_index('ix_execution_logs_execution_id', 'execution_logs', ['execution_id'])
    op.create_index('ix_execution_logs_step_name', 'execution_logs', ['step_name'])
    op.create_index('ix_execution_logs_level', 'execution_logs', ['level'])
    op.create_index('ix_execution_logs_timestamp', 'execution_logs', ['timestamp'])

    op.create_table(
        'triggers',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('workflow_id', sa.String(36), nullable=False),
        sa.Column('type', sa.Enum('manual', 'webhook', 'schedule', name='triggertype'), nullable=False),
        sa.Column('config', sa.JSON(), nullable=False),
        sa.Column('webhook_id', sa.String(36), nullable=True),
        sa.Column('webhook_secret', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['workflow_id'], ['workflows.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('webhook_id')
    )
    op.create_index('idx_trigger_workflow_type', 'triggers', ['workflow_id', 'type'])
    op.create_index('ix_triggers_workflow_id', 'triggers', ['workflow_id'])
    op.create_index('ix_triggers_type', 'triggers', ['type'])
    op.create_index('ix_triggers_webhook_id', 'triggers', ['webhook_id'])

def downgrade() -> None:
    op.drop_index('ix_triggers_webhook_id', table_name='triggers')
    op.drop_index('ix_triggers_type', table_name='triggers')
    op.drop_index('ix_triggers_workflow_id', table_name='triggers')
    op.drop_index('idx_trigger_workflow_type', table_name='triggers')
    op.drop_table('triggers')
    op.drop_index('ix_execution_logs_timestamp', table_name='execution_logs')
    op.drop_index('ix_execution_logs_level', table_name='execution_logs')
    op.drop_index('ix_execution_logs_step_name', table_name='execution_logs')
    op.drop_index('ix_execution_logs_execution_id', table_name='execution_logs')
    op.drop_index('idx_log_execution_level', table_name='execution_logs')
    op.drop_index('idx_log_execution_step', table_name='execution_logs')
    op.drop_table('execution_logs')
    op.drop_index('ix_executions_status', table_name='executions')
    op.drop_index('ix_executions_workflow_id', table_name='executions')
    op.drop_index('idx_execution_status_created', table_name='executions')
    op.drop_index('idx_execution_workflow_status', table_name='executions')
    op.drop_table('executions')
    op.drop_index('ix_workflows_status', table_name='workflows')
    op.drop_index('ix_workflows_name', table_name='workflows')
    op.drop_index('idx_workflow_status_created', table_name='workflows')
    op.drop_table('workflows')
