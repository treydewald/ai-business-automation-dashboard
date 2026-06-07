"""Tests for health and status endpoints"""

import pytest
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db import Base, get_db
from app.models.workflow import Workflow, WorkflowStatus
from app.models.execution import Execution, ExecutionStatus

@pytest.fixture
def db():
    """Create in-memory test database"""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    yield session
    session.close()

@pytest.fixture
def sample_data(db):
    """Create sample workflows and executions"""
    workflows = []
    for i in range(3):
        workflow = Workflow(
            id=f"workflow-{i}",
            name=f"Test Workflow {i}",
            description=f"Test workflow {i}",
            definition={"steps": []},
            status=WorkflowStatus.ACTIVE
        )
        db.add(workflow)
        workflows.append(workflow)

    db.commit()

    executions = []
    executions.append(Execution(
        id="exec-1",
        workflow_id="workflow-0",
        status=ExecutionStatus.COMPLETED,
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow(),
        duration_seconds=10.5
    ))
    executions.append(Execution(
        id="exec-2",
        workflow_id="workflow-0",
        status=ExecutionStatus.FAILED,
        error_message="Test error",
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow(),
        duration_seconds=5.0
    ))
    executions.append(Execution(
        id="exec-3",
        workflow_id="workflow-1",
        status=ExecutionStatus.RUNNING,
        started_at=datetime.utcnow()
    ))
    executions.append(Execution(
        id="exec-4",
        workflow_id="workflow-2",
        status=ExecutionStatus.PENDING
    ))

    for execution in executions:
        db.add(execution)

    db.commit()
    return workflows, executions

class TestExecutionQueries:
    """Test execution database queries"""

    def test_create_executions(self, sample_data):
        """Test creating executions"""
        workflows, executions = sample_data
        assert len(workflows) == 3
        assert len(executions) == 4

    def test_count_by_status(self, db, sample_data):
        """Test counting executions by status"""
        workflows, executions = sample_data

        completed = db.query(Execution).filter(Execution.status == ExecutionStatus.COMPLETED).count()
        running = db.query(Execution).filter(Execution.status == ExecutionStatus.RUNNING).count()
        failed = db.query(Execution).filter(Execution.status == ExecutionStatus.FAILED).count()

        assert completed == 1
        assert running == 1
        assert failed == 1
