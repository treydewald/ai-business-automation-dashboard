from typing import Dict, Any, Callable, Optional
import logging
from datetime import datetime
from app.engine.exceptions import StepExecutionError, ExecutionTimeoutError
from app.engine.retry_policy import RetryPolicy

logger = logging.getLogger(__name__)

class StepExecutor:
    def __init__(self, step: Dict[str, Any], context: Dict[str, Any]):
        self.step = step
        self.context = context
        self.retry_policy = RetryPolicy()

    def execute(self, step_handlers: Dict[str, Callable]) -> Dict[str, Any]:
        step_id = self.step.get("id")
        step_type = self.step.get("type")
        timeout = self.step.get("timeout", 300)

        if step_type not in step_handlers:
            raise StepExecutionError(f"Unknown step type: {step_type}")

        handler = step_handlers[step_type]

        try:
            result = self.retry_policy.execute_with_retry(
                handler,
                self.step,
                self.context
            )
            return {
                "id": step_id,
                "status": "completed",
                "result": result,
                "error": None,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error executing step {step_id}: {str(e)}")
            return {
                "id": step_id,
                "status": "failed",
                "result": None,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }

    @staticmethod
    def interpolate_variables(value: Any, context: Dict[str, Any]) -> Any:
        if isinstance(value, str):
            for key, val in context.items():
                placeholder = f"${{{key}}}"
                if placeholder in value:
                    value = value.replace(placeholder, str(val))
            return value
        elif isinstance(value, dict):
            return {k: StepExecutor.interpolate_variables(v, context) for k, v in value.items()}
        elif isinstance(value, list):
            return [StepExecutor.interpolate_variables(item, context) for item in value]
        return value
