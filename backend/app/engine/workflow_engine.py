import logging
from typing import Dict, Any, Callable, Optional
from datetime import datetime
from app.engine.dag_parser import DAGParser
from app.engine.step_executor import StepExecutor
from app.engine.exceptions import DAGValidationError, StepExecutionError

logger = logging.getLogger(__name__)

class WorkflowEngine:
    def __init__(self, workflow_definition: Dict[str, Any]):
        self.definition = workflow_definition
        self.parser = DAGParser(workflow_definition)
        self.execution_order = self.parser.get_execution_order()

    def execute(
        self,
        step_handlers: Dict[str, Callable],
        initial_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        context = initial_context or {}
        execution_logs = []
        status = "completed"
        error = None

        try:
            for step_id in self.execution_order:
                step = self.parser.get_step_by_id(step_id)
                logger.info(f"Executing step: {step_id}")

                executor = StepExecutor(step, context)
                result = executor.execute(step_handlers)

                execution_logs.append(result)

                if result["status"] == "failed":
                    status = "failed"
                    error = result["error"]
                    logger.error(f"Step {step_id} failed: {error}")
                    break

                context[step_id] = result.get("result")

            return {
                "status": status,
                "context": context,
                "logs": execution_logs,
                "error": error,
                "completed_at": datetime.utcnow().isoformat()
            }

        except DAGValidationError as e:
            logger.error(f"DAG validation error: {str(e)}")
            return {
                "status": "failed",
                "context": context,
                "logs": execution_logs,
                "error": f"DAG validation error: {str(e)}",
                "completed_at": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Unexpected error during execution: {str(e)}")
            return {
                "status": "failed",
                "context": context,
                "logs": execution_logs,
                "error": f"Unexpected error: {str(e)}",
                "completed_at": datetime.utcnow().isoformat()
            }
