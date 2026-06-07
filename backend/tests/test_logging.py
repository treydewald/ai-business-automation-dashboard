"""Tests for logging service"""

import pytest
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db import Base
from app.models.execution_log import ExecutionLog, LogLevel
from app.models.execution import Execution, ExecutionStatus
from app.models.workflow import Workflow, WorkflowStatus
from app.services.logging_service import LoggingService

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
def sample_workflow_and_execution(db):
    """Create sample workflow and execution for testing"""
    workflow = Workflow(
        id="test-workflow-1",
        name="Test Workflow",
        description="Test workflow for logging",
        definition={"steps": []},
        status=WorkflowStatus.ACTIVE
    )
    db.add(workflow)
    db.commit()

    execution = Execution(
        id="test-execution-1",
        workflow_id=workflow.id,
        status=ExecutionStatus.RUNNING
    )
    db.add(execution)
    db.commit()
    db.refresh(execution)
    return workflow, execution

class TestLoggingService:
    """Test LoggingService"""

    def test_create_log(self, db, sample_workflow_and_execution):
        """Test creating a log entry"""
        workflow, execution = sample_workflow_and_execution
        log = LoggingService.create_log(
            db=db,
            execution_id=execution.id,
            step_name="step1",
            level=LogLevel.INFO,
            message="Test message"
        )
        assert log.id is not None
        assert log.execution_id == execution.id
        assert log.step_name == "step1"
        assert log.level == LogLevel.INFO
        assert log.message == "Test message"

    def test_create_log_with_context(self, db, sample_workflow_and_execution):
        """Test creating a log entry with context"""
        workflow, execution = sample_workflow_and_execution
        context = {"key": "value", "count": 42}
        log = LoggingService.create_log(
            db=db,
            execution_id=execution.id,
            step_name="step1",
            level=LogLevel.DEBUG,
            message="Debug message",
            context=context
        )
        assert log.context_json == context

    def test_get_execution_logs(self, db, sample_workflow_and_execution):
        """Test retrieving execution logs"""
        workflow, execution = sample_workflow_and_execution
        for i in range(5):
            LoggingService.create_log(
                db=db,
                execution_id=execution.id,
                step_name=f"step{i}",
                level=LogLevel.INFO,
                message=f"Message {i}"
            )

        logs, total = LoggingService.get_execution_logs(db, execution.id)
        assert len(logs) == 5
        assert total == 5

    def test_get_execution_logs_pagination(self, db, sample_workflow_and_execution):
        """Test log pagination"""
        workflow, execution = sample_workflow_and_execution
        for i in range(250):
            LoggingService.create_log(
                db=db,
                execution_id=execution.id,
                step_name=f"step{i % 10}",
                level=LogLevel.INFO,
                message=f"Message {i}"
            )

        logs1, total = LoggingService.get_execution_logs(db, execution.id, skip=0, limit=100)
        logs2, _ = LoggingService.get_execution_logs(db, execution.id, skip=100, limit=100)
        logs3, _ = LoggingService.get_execution_logs(db, execution.id, skip=200, limit=100)

        assert len(logs1) == 100
        assert len(logs2) == 100
        assert len(logs3) == 50
        assert total == 250

    def test_get_logs_by_level(self, db, sample_workflow_and_execution):
        """Test filtering logs by level"""
        workflow, execution = sample_workflow_and_execution
        LoggingService.create_log(db, execution.id, "step1", LogLevel.INFO, "Info message")
        LoggingService.create_log(db, execution.id, "step2", LogLevel.ERROR, "Error message")
        LoggingService.create_log(db, execution.id, "step3", LogLevel.WARN, "Warn message")
        LoggingService.create_log(db, execution.id, "step4", LogLevel.ERROR, "Another error")

        error_logs, total = LoggingService.get_logs_by_level(db, execution.id, LogLevel.ERROR)
        assert len(error_logs) == 2
        assert total == 2

    def test_get_logs_by_step(self, db, sample_workflow_and_execution):
        """Test filtering logs by step name"""
        workflow, execution = sample_workflow_and_execution
        LoggingService.create_log(db, execution.id, "step1", LogLevel.INFO, "Message 1")
        LoggingService.create_log(db, execution.id, "step2", LogLevel.INFO, "Message 2")
        LoggingService.create_log(db, execution.id, "step1", LogLevel.INFO, "Message 3")

        step1_logs, total = LoggingService.get_logs_by_step(db, execution.id, "step1")
        assert len(step1_logs) == 2
        assert total == 2

    def test_get_logs_by_time_range(self, db, sample_workflow_and_execution):
        """Test filtering logs by time range"""
        workflow, execution = sample_workflow_and_execution
        now = datetime.utcnow()

        log1 = LoggingService.create_log(
            db=db,
            execution_id=execution.id,
            step_name="step1",
            level=LogLevel.INFO,
            message="Old message"
        )
        log1.timestamp = now - timedelta(hours=2)
        db.commit()

        log2 = LoggingService.create_log(
            db=db,
            execution_id=execution.id,
            step_name="step2",
            level=LogLevel.INFO,
            message="Recent message"
        )

        start = now - timedelta(hours=1)
        end = now + timedelta(hours=1)
        logs, total = LoggingService.get_logs_by_time_range(db, execution.id, start, end)

        assert len(logs) == 1
        assert logs[0].id == log2.id

    def test_search_logs(self, db, sample_workflow_and_execution):
        """Test searching logs by message"""
        workflow, execution = sample_workflow_and_execution
        LoggingService.create_log(db, execution.id, "step1", LogLevel.INFO, "Database error occurred")
        LoggingService.create_log(db, execution.id, "step2", LogLevel.INFO, "Processing data")
        LoggingService.create_log(db, execution.id, "step3", LogLevel.ERROR, "Connection error")

        search_results, total = LoggingService.search_logs(db, execution.id, "error")
        assert len(search_results) == 2
        assert total == 2

    def test_delete_old_logs(self, db, sample_workflow_and_execution):
        """Test deleting old logs"""
        workflow, execution = sample_workflow_and_execution

        old_log = LoggingService.create_log(
            db=db,
            execution_id=execution.id,
            step_name="step1",
            level=LogLevel.INFO,
            message="Old message"
        )
        old_log.timestamp = datetime.utcnow() - timedelta(days=40)
        db.commit()

        new_log = LoggingService.create_log(
            db=db,
            execution_id=execution.id,
            step_name="step2",
            level=LogLevel.INFO,
            message="Recent message"
        )

        deleted = LoggingService.delete_old_logs(db, retention_days=30)
        assert deleted >= 1

        logs, total = LoggingService.get_execution_logs(db, execution.id)
        assert len(logs) == 1
        assert logs[0].id == new_log.id

    def test_get_log_levels(self):
        """Test getting all log levels"""
        levels = LoggingService.get_log_levels()
        assert "INFO" in levels
        assert "ERROR" in levels
        assert "WARN" in levels
        assert "DEBUG" in levels
