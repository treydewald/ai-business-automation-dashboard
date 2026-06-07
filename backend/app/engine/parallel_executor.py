import logging
import asyncio
from typing import Dict, Any, List, Callable, Set
from datetime import datetime
from app.engine.step_executor import StepExecutor
from app.engine.exceptions import StepExecutionError

logger = logging.getLogger(__name__)


class ParallelExecutor:
    """Executes steps in parallel, respecting DAG dependencies."""

    def __init__(self, dag_adjacency: Dict[str, List[str]]):
        self.dag_adjacency = dag_adjacency

    def find_parallel_groups(self, execution_order: List[str]) -> List[Set[str]]:
        """Find groups of steps that can execute in parallel."""
        in_degree = {step: 0 for step in execution_order}
        for step in execution_order:
            for dep in self.dag_adjacency.get(step, []):
                in_degree[dep] += 1

        groups = []
        processed = set()

        while len(processed) < len(execution_order):
            current_group = {
                step for step in execution_order
                if in_degree[step] == 0 and step not in processed
            }

            if not current_group:
                break

            groups.append(current_group)
            processed.update(current_group)

            for step in current_group:
                for next_step in self.dag_adjacency.get(step, []):
                    in_degree[next_step] -= 1

        return groups

    async def execute_group_async(
        self,
        steps: Set[str],
        step_map: Dict[str, Dict[str, Any]],
        step_handlers: Dict[str, Callable],
        context: Dict[str, Any],
        timeout: int = 300
    ) -> tuple[Dict[str, Any], List[Dict[str, Any]]]:
        """Execute a group of steps in parallel."""
        tasks = []
        step_ids = list(steps)

        for step_id in step_ids:
            step = step_map[step_id]
            executor = StepExecutor(step, context)
            task = asyncio.create_task(
                self._execute_step_async(executor, step_handlers, timeout)
            )
            tasks.append((step_id, task))

        results = {}
        logs = []
        failed_steps = []

        try:
            for step_id, task in tasks:
                result = await asyncio.wait_for(task, timeout=timeout)
                logs.append(result)
                if result["status"] == "failed":
                    failed_steps.append(step_id)
                else:
                    results[step_id] = result.get("result")
        except asyncio.TimeoutError as e:
            logger.error(f"Parallel group execution timed out: {str(e)}")
            raise StepExecutionError(f"Parallel execution timeout: {str(e)}")
        except Exception as e:
            logger.error(f"Parallel execution error: {str(e)}")
            raise StepExecutionError(f"Parallel execution failed: {str(e)}")

        return results, logs, failed_steps

    @staticmethod
    async def _execute_step_async(
        executor: StepExecutor,
        step_handlers: Dict[str, Callable],
        timeout: int
    ) -> Dict[str, Any]:
        """Execute a single step asynchronously."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            lambda: executor.execute(step_handlers)
        )

    def execute_parallel(
        self,
        execution_order: List[str],
        step_map: Dict[str, Dict[str, Any]],
        step_handlers: Dict[str, Callable],
        context: Dict[str, Any]
    ) -> tuple[Dict[str, Any], List[Dict[str, Any]], str, Any]:
        """Execute workflow with parallel groups."""
        groups = self.find_parallel_groups(execution_order)
        all_logs = []
        status = "completed"
        error = None

        try:
            for group in groups:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)

                try:
                    results, logs, failed_steps = loop.run_until_complete(
                        self.execute_group_async(
                            group, step_map, step_handlers, context
                        )
                    )
                finally:
                    loop.close()

                all_logs.extend(logs)

                if failed_steps:
                    status = "failed"
                    error = f"Steps failed: {', '.join(failed_steps)}"
                    break

                context.update(results)

            return context, all_logs, status, error

        except Exception as e:
            logger.error(f"Parallel execution failed: {str(e)}")
            return context, all_logs, "failed", str(e)
