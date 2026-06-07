import logging
from typing import Dict, Any, Callable, Optional
from datetime import datetime
from app.engine.dag_parser import DAGParser
from app.engine.step_executor import StepExecutor
from app.engine.parallel_executor import ParallelExecutor
from app.engine.loop_executor import LoopExecutor
from app.engine.branching_executor import BranchingExecutor
from app.engine.exceptions import DAGValidationError, StepExecutionError

logger = logging.getLogger(__name__)

class WorkflowEngine:
    def __init__(self, workflow_definition: Dict[str, Any]):
        self.definition = workflow_definition
        self.parser = DAGParser(workflow_definition)
        self.execution_order = self.parser.get_execution_order()
        self.loop_executor = LoopExecutor()
        self.branching_executor = BranchingExecutor()
        self.parallel_executor = ParallelExecutor(
            self.parser._build_adjacency_list()
        )

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
            step_map = {step["id"]: step for step in self.definition.get("steps", [])}

            for step_id in self.execution_order:
                step = self.parser.get_step_by_id(step_id)
                logger.info(f"Executing step: {step_id}")

                step_type = step.get("type", "standard")
                result = None
                step_logs = []

                try:
                    if step_type == "parallel":
                        context, step_logs, exec_status, exec_error = (
                            self._execute_parallel_step(step, step_handlers, context)
                        )
                        if exec_status == "failed":
                            status = "failed"
                            error = exec_error
                            execution_logs.extend(step_logs)
                            break
                        execution_logs.extend(step_logs)

                    elif step_type == "for-each":
                        items = StepExecutor.interpolate_variables(
                            step.get("items", []), context
                        )
                        results, step_logs, exec_status, exec_error = (
                            self.loop_executor.execute_for_each(
                                step, items, step_handlers, context
                            )
                        )
                        if exec_status == "failed":
                            status = "failed"
                            error = exec_error
                            execution_logs.extend(step_logs)
                            break
                        context[step_id] = results
                        execution_logs.extend(step_logs)

                    elif step_type == "while":
                        results, step_logs, exec_status, exec_error = (
                            self.loop_executor.execute_while(step, step_handlers, context)
                        )
                        if exec_status == "failed":
                            status = "failed"
                            error = exec_error
                            execution_logs.extend(step_logs)
                            break
                        context[step_id] = results
                        execution_logs.extend(step_logs)

                    elif step_type == "if":
                        branches = step.get("branches", [])
                        result, step_logs, exec_status, exec_error = (
                            self.branching_executor.execute_conditional(
                                step, branches, step_handlers, context
                            )
                        )
                        if exec_status == "failed":
                            status = "failed"
                            error = exec_error
                            execution_logs.extend(step_logs)
                            break
                        context[step_id] = result
                        execution_logs.extend(step_logs)

                    elif step_type == "switch":
                        switch_expr = step.get("switch_expr", "")
                        cases = step.get("cases", [])
                        result, step_logs, exec_status, exec_error = (
                            self.branching_executor.execute_switch(
                                step, switch_expr, cases, step_handlers, context
                            )
                        )
                        if exec_status == "failed":
                            status = "failed"
                            error = exec_error
                            execution_logs.extend(step_logs)
                            break
                        context[step_id] = result
                        execution_logs.extend(step_logs)

                    else:
                        executor = StepExecutor(step, context)
                        result = executor.execute(step_handlers)
                        execution_logs.append(result)

                        if result["status"] == "failed":
                            status = "failed"
                            error = result["error"]
                            logger.error(f"Step {step_id} failed: {error}")
                            break

                        context[step_id] = result.get("result")

                except Exception as e:
                    logger.error(f"Error executing step {step_id}: {str(e)}")
                    status = "failed"
                    error = str(e)
                    break

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

    def _execute_parallel_step(
        self,
        step: Dict[str, Any],
        step_handlers: Dict[str, Callable],
        context: Dict[str, Any]
    ) -> tuple[Dict[str, Any], list, str, Optional[str]]:
        """Execute a parallel step."""
        parallel_steps = step.get("parallel_steps", [])
        timeout = step.get("timeout", 300)

        step_map = {s["id"]: s for s in parallel_steps}
        execution_order = [s["id"] for s in parallel_steps]

        return self.parallel_executor.execute_parallel(
            execution_order, step_map, step_handlers, context
        )
