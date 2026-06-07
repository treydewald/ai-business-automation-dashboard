import logging
from typing import Dict, Any, List, Callable, Optional
from app.engine.step_executor import StepExecutor
from app.engine.exceptions import StepExecutionError

logger = logging.getLogger(__name__)


class BranchingExecutor:
    """Executes conditional branches in workflows."""

    def execute_conditional(
        self,
        step: Dict[str, Any],
        condition_branches: List[Dict[str, Any]],
        step_handlers: Dict[str, Callable],
        context: Dict[str, Any]
    ) -> tuple[Any, List[Dict[str, Any]], str, Optional[str]]:
        """Execute conditional branching (if/else)."""
        logs = []
        status = "completed"
        error = None
        result = None

        for branch in condition_branches:
            condition = branch.get("condition")
            branch_steps = branch.get("steps", [])

            try:
                if self._evaluate_condition(condition, context):
                    result, branch_logs, exec_status, exec_error = (
                        self._execute_branch(branch_steps, step_handlers, context)
                    )
                    logs.extend(branch_logs)

                    if exec_status == "failed":
                        status = "failed"
                        error = exec_error
                    return result, logs, status, error

            except Exception as e:
                logger.error(f"Condition evaluation error: {str(e)}")
                logs.append({
                    "id": step.get("id"),
                    "status": "failed",
                    "error": str(e),
                    "timestamp": str(__import__('datetime').datetime.utcnow().isoformat())
                })

        return result, logs, status, error

    def execute_switch(
        self,
        step: Dict[str, Any],
        switch_expr: str,
        cases: List[Dict[str, Any]],
        step_handlers: Dict[str, Callable],
        context: Dict[str, Any]
    ) -> tuple[Any, List[Dict[str, Any]], str, Optional[str]]:
        """Execute switch/case branching."""
        logs = []
        status = "completed"
        error = None
        result = None

        try:
            switch_value = self._evaluate_expression(switch_expr, context)

            for case in cases:
                case_value = case.get("value")
                case_steps = case.get("steps", [])

                if self._values_equal(switch_value, case_value):
                    result, case_logs, exec_status, exec_error = (
                        self._execute_branch(case_steps, step_handlers, context)
                    )
                    logs.extend(case_logs)

                    if exec_status == "failed":
                        status = "failed"
                        error = exec_error
                    return result, logs, status, error

            default_case = next((c for c in cases if c.get("default")), None)
            if default_case:
                default_steps = default_case.get("steps", [])
                result, case_logs, exec_status, exec_error = (
                    self._execute_branch(default_steps, step_handlers, context)
                )
                logs.extend(case_logs)
                if exec_status == "failed":
                    status = "failed"
                    error = exec_error

        except Exception as e:
            logger.error(f"Switch execution error: {str(e)}")
            status = "failed"
            error = str(e)

        return result, logs, status, error

    def _execute_branch(
        self,
        branch_steps: List[Dict[str, Any]],
        step_handlers: Dict[str, Callable],
        context: Dict[str, Any]
    ) -> tuple[Any, List[Dict[str, Any]], str, Optional[str]]:
        """Execute all steps in a branch."""
        logs = []
        status = "completed"
        error = None
        result = None

        for step in branch_steps:
            executor = StepExecutor(step, context)
            try:
                step_result = executor.execute(step_handlers)
                logs.append(step_result)

                if step_result["status"] == "failed":
                    status = "failed"
                    error = step_result.get("error")
                    break

                context[step.get("id")] = step_result.get("result")
                result = step_result.get("result")

            except Exception as e:
                logger.error(f"Step execution error in branch: {str(e)}")
                status = "failed"
                error = str(e)
                break

        return result, logs, status, error

    @staticmethod
    def _evaluate_condition(condition_expr: str, context: Dict[str, Any]) -> bool:
        """Evaluate a condition expression against context."""
        try:
            expr = condition_expr
            for key, value in context.items():
                expr = expr.replace(f"${{{key}}}", repr(value))
            return bool(eval(expr, {"__builtins__": {}}, {}))
        except Exception as e:
            logger.error(f"Condition evaluation failed: {str(e)}")
            raise StepExecutionError(f"Invalid condition: {str(e)}")

    @staticmethod
    def _evaluate_expression(expr: str, context: Dict[str, Any]) -> Any:
        """Evaluate an expression and return the value."""
        try:
            for key, value in context.items():
                expr = expr.replace(f"${{{key}}}", repr(value))
            return eval(expr, {"__builtins__": {}}, {})
        except Exception as e:
            logger.error(f"Expression evaluation failed: {str(e)}")
            raise StepExecutionError(f"Invalid expression: {str(e)}")

    @staticmethod
    def _values_equal(value1: Any, value2: Any) -> bool:
        """Check if two values are equal."""
        return value1 == value2
