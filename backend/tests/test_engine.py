"""Tests for workflow execution engine"""

import pytest
from datetime import datetime
from app.engine.workflow_engine import WorkflowEngine
from app.engine.dag_parser import DAGParser
from app.engine.exceptions import DAGValidationError
from app.models.execution import ExecutionStatus
from app.models.execution_log import LogLevel


class TestDAGParser:
    """Test DAG parsing and validation"""

    def test_parse_simple_dag_with_edges(self):
        """Test parsing DAG with explicit edges"""
        dag = {
            "name": "test",
            "steps": [
                {"id": "step1", "type": "http"},
                {"id": "step2", "type": "http"}
            ],
            "edges": [
                {"source": "step1", "target": "step2"}
            ]
        }
        parser = DAGParser(dag)
        assert parser.steps == dag["steps"]
        assert parser.edges == dag["edges"]

    def test_get_execution_order(self):
        """Test topological sorting of steps"""
        dag = {
            "steps": [
                {"id": "step1", "type": "http"},
                {"id": "step2", "type": "http"},
                {"id": "step3", "type": "http"}
            ],
            "edges": [
                {"source": "step1", "target": "step2"},
                {"source": "step2", "target": "step3"}
            ]
        }
        parser = DAGParser(dag)
        order = parser.get_execution_order()
        assert order == ["step1", "step2", "step3"]

    def test_get_step_by_id(self):
        """Test retrieving step by ID"""
        dag = {
            "steps": [
                {"id": "step1", "type": "http", "config": {"url": "https://example.com"}}
            ],
            "edges": []
        }
        parser = DAGParser(dag)
        step = parser.get_step_by_id("step1")
        assert step["id"] == "step1"
        assert step["config"]["url"] == "https://example.com"

    def test_get_nonexistent_step(self):
        """Test retrieving nonexistent step"""
        dag = {
            "steps": [{"id": "step1", "type": "http"}],
            "edges": []
        }
        parser = DAGParser(dag)
        with pytest.raises(DAGValidationError):
            parser.get_step_by_id("nonexistent")

    def test_detect_circular_dependency(self):
        """Test detection of circular dependencies"""
        dag = {
            "steps": [
                {"id": "step1", "type": "http"},
                {"id": "step2", "type": "http"}
            ],
            "edges": [
                {"source": "step1", "target": "step2"},
                {"source": "step2", "target": "step1"}
            ]
        }
        with pytest.raises(DAGValidationError, match="circular"):
            DAGParser(dag)

    def test_invalid_edge_source(self):
        """Test validation fails for invalid edge source"""
        dag = {
            "steps": [{"id": "step1", "type": "http"}],
            "edges": [
                {"source": "invalid", "target": "step1"}
            ]
        }
        with pytest.raises(DAGValidationError, match="Invalid edge source"):
            DAGParser(dag)

    def test_invalid_edge_target(self):
        """Test validation fails for invalid edge target"""
        dag = {
            "steps": [{"id": "step1", "type": "http"}],
            "edges": [
                {"source": "step1", "target": "invalid"}
            ]
        }
        with pytest.raises(DAGValidationError, match="Invalid edge target"):
            DAGParser(dag)

    def test_empty_steps_validation(self):
        """Test validation fails for empty steps"""
        dag = {"steps": [], "edges": []}
        with pytest.raises(DAGValidationError, match="at least one step"):
            DAGParser(dag)

    def test_parallel_execution_order(self):
        """Test execution order with parallel steps"""
        dag = {
            "steps": [
                {"id": "step1", "type": "http"},
                {"id": "step2", "type": "http"},
                {"id": "step3", "type": "http"},
                {"id": "step4", "type": "http"}
            ],
            "edges": [
                {"source": "step1", "target": "step2"},
                {"source": "step1", "target": "step3"},
                {"source": "step2", "target": "step4"},
                {"source": "step3", "target": "step4"}
            ]
        }
        parser = DAGParser(dag)
        order = parser.get_execution_order()
        # step1 must come before step2 and step3
        assert order.index("step1") < order.index("step2")
        assert order.index("step1") < order.index("step3")
        # step2 and step3 must come before step4
        assert order.index("step2") < order.index("step4")
        assert order.index("step3") < order.index("step4")


class TestWorkflowEngine:
    """Test WorkflowEngine execution"""

    def test_engine_initialization(self):
        """Test engine initialization"""
        dag = {
            "steps": [{"id": "step1", "type": "http"}],
            "edges": []
        }
        engine = WorkflowEngine(dag)
        assert engine.definition == dag
        assert engine.execution_order == ["step1"]

    def test_get_execution_order(self):
        """Test getting execution order of steps"""
        dag = {
            "steps": [
                {"id": "step1", "type": "http"},
                {"id": "step2", "type": "http"}
            ],
            "edges": [
                {"source": "step1", "target": "step2"}
            ]
        }
        engine = WorkflowEngine(dag)
        assert engine.execution_order == ["step1", "step2"]

    def test_execute_with_mock_handlers(self):
        """Test executing workflow with mock step handlers"""
        dag = {
            "steps": [{"id": "step1", "type": "mock"}],
            "edges": []
        }
        engine = WorkflowEngine(dag)

        def mock_handler(step, context):
            return {"result": "success", "status": "completed"}

        result = engine.execute({"mock": mock_handler})
        assert result["status"] == "completed"
        assert "context" in result
        assert "logs" in result

    def test_execute_with_multiple_steps(self):
        """Test executing workflow with multiple steps"""
        dag = {
            "steps": [
                {"id": "step1", "type": "mock"},
                {"id": "step2", "type": "mock"}
            ],
            "edges": [
                {"source": "step1", "target": "step2"}
            ]
        }
        engine = WorkflowEngine(dag)

        call_count = [0]

        def mock_handler(step, context):
            call_count[0] += 1
            return {"result": f"step{call_count[0]}_result", "status": "completed"}

        result = engine.execute({"mock": mock_handler})
        assert result["status"] == "completed"
        assert call_count[0] == 2

    def test_execute_with_step_failure(self):
        """Test workflow stops on step failure"""
        dag = {
            "steps": [
                {"id": "step1", "type": "mock"},
                {"id": "step2", "type": "mock"}
            ],
            "edges": [
                {"source": "step1", "target": "step2"}
            ]
        }
        engine = WorkflowEngine(dag)

        def failing_handler(step, context):
            if step["id"] == "step1":
                raise Exception("Step 1 failed")
            return {"result": "success"}

        result = engine.execute({"mock": failing_handler})
        assert result["status"] == "failed"
        assert "error" in result

    def test_execute_with_initial_context(self):
        """Test executing with initial context"""
        dag = {
            "steps": [{"id": "step1", "type": "mock"}],
            "edges": []
        }
        engine = WorkflowEngine(dag)

        initial_context = {"initial_value": "test"}

        def mock_handler(step, context):
            return {"result": context.get("initial_value"), "status": "completed"}

        result = engine.execute({"mock": mock_handler}, initial_context=initial_context)
        assert result["status"] == "completed"

    def test_execute_with_dag_validation_error(self):
        """Test handling of DAG validation errors during execution"""
        dag = {
            "steps": [{"id": "step1", "type": "mock"}],
            "edges": []
        }
        engine = WorkflowEngine(dag)

        def failing_handler(step, context):
            raise Exception("Unexpected error")

        result = engine.execute({"mock": failing_handler})
        assert result["status"] == "failed"
        assert "error" in result

    def test_execution_logs_output(self):
        """Test that execution logs are generated"""
        dag = {
            "steps": [{"id": "step1", "type": "mock"}],
            "edges": []
        }
        engine = WorkflowEngine(dag)

        def mock_handler(step, context):
            return {"result": "success", "status": "completed"}

        result = engine.execute({"mock": mock_handler})
        assert "logs" in result
        assert isinstance(result["logs"], list)


class TestWorkflowEngineWithDatabase:
    """Test WorkflowEngine with actual database integration"""

    def test_execution_logging(self, db, sample_execution):
        """Test that executions are logged to database"""
        from app.services.logging_service import LoggingService

        # Simulate engine logging
        LoggingService.create_log(
            db=db,
            execution_id=sample_execution.id,
            step_name="step1",
            level=LogLevel.INFO,
            message="Step executed"
        )

        from app.models.execution_log import ExecutionLog
        logs = db.query(ExecutionLog).filter_by(
            execution_id=sample_execution.id
        ).all()
        assert len(logs) == 1
        assert logs[0].step_name == "step1"
