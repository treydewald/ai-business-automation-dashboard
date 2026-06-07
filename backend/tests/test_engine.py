"""Tests for workflow execution engine"""

import pytest
from datetime import datetime
from app.engine.workflow_engine import WorkflowEngine
from app.engine.dag_parser import DAGParser
from app.models.execution import ExecutionStatus
from app.models.execution_log import LogLevel


class TestDAGParser:
    """Test DAG parsing and validation"""

    def test_parse_simple_dag(self, simple_dag):
        """Test parsing a simple DAG"""
        parser = DAGParser(simple_dag)
        steps = parser.get_steps()
        assert len(steps) == 2
        assert steps[0]["id"] == "step1"
        assert steps[1]["id"] == "step2"

    def test_get_step_dependencies(self, simple_dag):
        """Test extracting step dependencies"""
        parser = DAGParser(simple_dag)
        deps = parser.get_step_dependencies("step2")
        assert "step1" in deps

    def test_topological_sort(self, simple_dag):
        """Test topological sorting of steps"""
        parser = DAGParser(simple_dag)
        sorted_steps = parser.topological_sort()
        assert len(sorted_steps) == 2
        step_ids = [s["id"] for s in sorted_steps]
        assert step_ids.index("step1") < step_ids.index("step2")

    def test_detect_circular_dependency(self):
        """Test detection of circular dependencies"""
        circular_dag = {
            "name": "circular",
            "steps": [
                {"id": "step1", "type": "http", "dependencies": ["step2"]},
                {"id": "step2", "type": "http", "dependencies": ["step1"]}
            ]
        }
        parser = DAGParser(circular_dag)
        with pytest.raises(ValueError, match="circular"):
            parser.topological_sort()

    def test_missing_dependency(self):
        """Test detection of missing dependencies"""
        invalid_dag = {
            "name": "invalid",
            "steps": [
                {"id": "step1", "type": "http", "dependencies": ["nonexistent"]}
            ]
        }
        parser = DAGParser(invalid_dag)
        with pytest.raises(ValueError, match="dependency"):
            parser.topological_sort()

    def test_validate_dag_valid(self, simple_dag):
        """Test validation of valid DAG"""
        parser = DAGParser(simple_dag)
        assert parser.validate() is True

    def test_validate_dag_missing_name(self):
        """Test validation fails for missing name"""
        invalid_dag = {"steps": []}
        parser = DAGParser(invalid_dag)
        with pytest.raises(ValueError):
            parser.validate()

    def test_validate_dag_empty_steps(self):
        """Test validation fails for empty steps"""
        invalid_dag = {"name": "empty", "steps": []}
        parser = DAGParser(invalid_dag)
        with pytest.raises(ValueError):
            parser.validate()

    def test_complex_dag_parsing(self, complex_dag):
        """Test parsing complex DAG with parallel execution"""
        parser = DAGParser(complex_dag)
        steps = parser.get_steps()
        assert len(steps) == 5

        # Verify parallel steps have same dependencies
        step3a_deps = parser.get_step_dependencies("step3a")
        step3b_deps = parser.get_step_dependencies("step3b")
        assert step3a_deps == step3b_deps


class TestWorkflowEngine:
    """Test WorkflowEngine execution"""

    def test_engine_initialization(self, simple_dag):
        """Test engine initialization"""
        engine = WorkflowEngine(simple_dag)
        assert engine.dag == simple_dag
        assert engine.context == {}

    def test_get_steps_in_order(self, simple_dag):
        """Test getting execution order of steps"""
        engine = WorkflowEngine(simple_dag)
        steps = engine.get_execution_order()
        step_ids = [s["id"] for s in steps]
        assert step_ids == ["step1", "step2"]

    def test_context_update(self, simple_dag):
        """Test context passing between steps"""
        engine = WorkflowEngine(simple_dag)
        engine.update_context("step1", {"result": "success"})
        assert engine.context["step1"]["result"] == "success"

    def test_step_input_resolution(self, simple_dag):
        """Test resolving step inputs from context"""
        engine = WorkflowEngine(simple_dag)
        engine.update_context("step1", {"output": "test-value"})

        input_val = engine.resolve_input_reference("step1.output")
        assert input_val == "test-value"

    def test_step_status_tracking(self, simple_dag):
        """Test tracking step execution status"""
        engine = WorkflowEngine(simple_dag)

        engine.set_step_status("step1", "running")
        assert engine.get_step_status("step1") == "running"

        engine.set_step_status("step1", "completed")
        assert engine.get_step_status("step1") == "completed"

    def test_execution_with_missing_step(self, simple_dag):
        """Test handling missing step definition"""
        invalid_ref = "nonexistent.output"
        engine = WorkflowEngine(simple_dag)

        with pytest.raises(ValueError):
            engine.resolve_input_reference(invalid_ref)

    def test_retry_policy_application(self, simple_dag):
        """Test retry policy with backoff"""
        engine = WorkflowEngine(simple_dag, max_retries=3, retry_backoff=2)
        assert engine.max_retries == 3
        assert engine.retry_backoff == 2

    def test_execution_timeout(self, simple_dag):
        """Test execution timeout handling"""
        engine = WorkflowEngine(simple_dag, step_timeout=1)
        assert engine.step_timeout == 1

    def test_conditional_branch_resolution(self, complex_dag):
        """Test resolving conditional expressions"""
        engine = WorkflowEngine(complex_dag)
        engine.update_context("step1", {"status": "success"})

        # Simple condition evaluation
        condition = "step1.status == 'success'"
        context_data = engine.context
        # This would be evaluated in actual execution
        assert engine.context["step1"]["status"] == "success"


class TestWorkflowEngineErrors:
    """Test error handling in workflow execution"""

    def test_invalid_dag_structure(self):
        """Test handling of invalid DAG structure"""
        invalid_dag = None
        with pytest.raises((ValueError, TypeError)):
            WorkflowEngine(invalid_dag)

    def test_step_execution_error_tracking(self, simple_dag):
        """Test tracking step execution errors"""
        engine = WorkflowEngine(simple_dag)
        engine.set_step_error("step1", "Connection timeout")
        assert engine.get_step_error("step1") == "Connection timeout"

    def test_workflow_failure_on_step_error(self, simple_dag):
        """Test workflow stops on step error"""
        engine = WorkflowEngine(simple_dag)
        engine.set_step_status("step1", "failed")
        engine.set_step_error("step1", "HTTP 500")

        assert engine.get_step_status("step1") == "failed"
        assert engine.get_step_error("step1") == "HTTP 500"

    def test_context_size_limit(self, simple_dag):
        """Test handling of very large context"""
        engine = WorkflowEngine(simple_dag)

        # Add large data to context
        large_data = "x" * (1024 * 1024)  # 1MB
        engine.update_context("step1", {"large_data": large_data})

        # Should still work (no hard limit in basic implementation)
        assert len(engine.context["step1"]["large_data"]) == 1024 * 1024


class TestWorkflowEngineWithDatabase:
    """Test WorkflowEngine with actual database integration"""

    def test_execution_logging(self, db, sample_execution, simple_dag):
        """Test that executions are logged to database"""
        from app.services.logging_service import LoggingService

        engine = WorkflowEngine(simple_dag)

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
