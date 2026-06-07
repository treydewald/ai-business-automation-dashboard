"""Pytest configuration and fixtures for backend tests"""

import pytest
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db import Base
from app.models.workflow import Workflow, WorkflowStatus
from app.models.execution import Execution, ExecutionStatus
from app.models.execution_log import ExecutionLog, LogLevel
from app.models.trigger import Trigger, TriggerType
import json


@pytest.fixture
def db_engine():
    """Create in-memory test database engine"""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)


@pytest.fixture
def db(db_engine):
    """Create database session for each test"""
    SessionLocal = sessionmaker(bind=db_engine)
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture
def sample_workflow(db):
    """Create a sample workflow for testing"""
    workflow = Workflow(
        id="test-workflow-1",
        name="Test Workflow",
        description="Test workflow",
        definition={
            "name": "test-workflow",
            "steps": [
                {"id": "step1", "name": "Step 1", "type": "http", "config": {}},
                {"id": "step2", "name": "Step 2", "type": "http", "config": {}},
            ]
        },
        status=WorkflowStatus.ACTIVE
    )
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    return workflow


@pytest.fixture
def sample_execution(db, sample_workflow):
    """Create a sample execution for testing"""
    execution = Execution(
        id="test-execution-1",
        workflow_id=sample_workflow.id,
        status=ExecutionStatus.RUNNING,
        started_at=datetime.utcnow(),
        result=None
    )
    db.add(execution)
    db.commit()
    db.refresh(execution)
    return execution


@pytest.fixture
def sample_execution_log(db, sample_execution):
    """Create a sample execution log for testing"""
    log = ExecutionLog(
        id="test-log-1",
        execution_id=sample_execution.id,
        step_name="test-step",
        level=LogLevel.INFO,
        message="Test log message",
        timestamp=datetime.utcnow(),
        context_json=json.dumps({"test": "data"})
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@pytest.fixture
def simple_dag():
    """Simple DAG definition for testing"""
    return {
        "name": "simple-workflow",
        "steps": [
            {
                "id": "step1",
                "name": "Step 1",
                "type": "http",
                "config": {"url": "https://example.com"}
            },
            {
                "id": "step2",
                "name": "Step 2",
                "type": "http",
                "config": {"url": "https://example.com"},
                "dependencies": ["step1"]
            }
        ]
    }


@pytest.fixture
def complex_dag():
    """Complex DAG with parallel and conditional execution"""
    return {
        "name": "complex-workflow",
        "steps": [
            {
                "id": "step1",
                "name": "Trigger",
                "type": "trigger",
                "config": {}
            },
            {
                "id": "step2",
                "name": "Check",
                "type": "conditional",
                "config": {"condition": "step1.status == 'success'"},
                "dependencies": ["step1"]
            },
            {
                "id": "step3a",
                "name": "Parallel A",
                "type": "http",
                "config": {"url": "https://example.com/a"},
                "dependencies": ["step2"]
            },
            {
                "id": "step3b",
                "name": "Parallel B",
                "type": "http",
                "config": {"url": "https://example.com/b"},
                "dependencies": ["step2"]
            },
            {
                "id": "step4",
                "name": "Aggregate",
                "type": "aggregate",
                "config": {},
                "dependencies": ["step3a", "step3b"]
            }
        ]
    }
