import logging
from typing import Dict, Any, List, Callable
from app.engine.step_executor import StepExecutor
from app.engine.exceptions import StepExecutionError

logger = logging.getLogger(__name__)


class LoopExecutor:
    """Executes steps with loop constructs (for-each, while)."""

    def __init__(self):
        self.max_iterations = 1000

    def execute_for_each(
        self,
        step: Dict[str, Any],
        items: List[Any],
        step_handlers: Dict[str, Callable],
        context: Dict[str, Any]
    ) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]], str, Any]:
        """Execute a step for each item in a list."""
        step_id = step.get("id")
        results = []
        logs = []
        status = "completed"
        error = None

        if not isinstance(items, list):
            return results, logs, "failed", f"for-each items must be a list, got {type(items)}"

        max_iter = step.get("max_iterations", self.max_iterations)
        if len(items) > max_iter:
            return (
                results, logs, "failed",
                f"for-each exceeds max iterations ({max_iter})"
            )

        for index, item in enumerate(items):
            iteration_context = context.copy()
            iteration_context["__loop_item"] = item
            iteration_context["__loop_index"] = index

            step_copy = step.copy()
            step_copy["id"] = f"{step_id}_iteration_{index}"

            executor = StepExecutor(step_copy, iteration_context)
            try:
                result = executor.execute(step_handlers)
                logs.append(result)

                if result["status"] == "failed":
                    status = "failed"
                    error = f"Iteration {index} failed: {result.get('error')}"
                    break

                results.append(result.get("result"))
            except Exception as e:
                logger.error(f"for-each iteration {index} failed: {str(e)}")
                status = "failed"
                error = str(e)
                break

        return results, logs, status, error

    def execute_while(
        self,
        step: Dict[str, Any],
        step_handlers: Dict[str, Callable],
        context: Dict[str, Any]
    ) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]], str, Any]:
        """Execute a step repeatedly while a condition is true."""
        step_id = step.get("id")
        results = []
        logs = []
        status = "completed"
        error = None

        condition_expr = step.get("while_condition")
        if not condition_expr:
            return results, logs, "failed", "while loop requires 'while_condition'"

        max_iter = step.get("max_iterations", self.max_iterations)
        iteration = 0

        while iteration < max_iter:
            try:
                condition_result = self._evaluate_condition(condition_expr, context)
                if not condition_result:
                    break

                step_copy = step.copy()
                step_copy["id"] = f"{step_id}_iteration_{iteration}"

                executor = StepExecutor(step_copy, context)
                result = executor.execute(step_handlers)
                logs.append(result)

                if result["status"] == "failed":
                    status = "failed"
                    error = f"Iteration {iteration} failed: {result.get('error')}"
                    break

                context.update({f"{step_id}_iteration_{iteration}": result.get("result")})
                results.append(result.get("result"))
                iteration += 1

            except Exception as e:
                logger.error(f"while loop iteration {iteration} failed: {str(e)}")
                status = "failed"
                error = str(e)
                break

        if iteration >= max_iter:
            logger.warning(f"while loop exceeded max iterations ({max_iter})")

        return results, logs, status, error

    @staticmethod
    def _evaluate_condition(condition_expr: str, context: Dict[str, Any]) -> bool:
        """Evaluate a condition expression against context."""
        try:
            for key, value in context.items():
                condition_expr = condition_expr.replace(f"${{{key}}}", str(value))

            return bool(eval(condition_expr, {"__builtins__": {}}, {}))
        except Exception as e:
            logger.error(f"Condition evaluation failed: {str(e)}")
            raise StepExecutionError(f"Invalid condition expression: {str(e)}")
