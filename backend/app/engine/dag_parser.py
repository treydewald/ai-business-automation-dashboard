from typing import Dict, List, Any, Set
from app.engine.exceptions import DAGValidationError

class DAGParser:
    def __init__(self, definition: Dict[str, Any]):
        self.definition = definition
        self.steps = definition.get("steps", [])
        self.edges = definition.get("edges", [])
        self.validate()

    def validate(self):
        if not self.steps:
            raise DAGValidationError("Workflow must have at least one step")

        step_ids = {step["id"] for step in self.steps}

        for edge in self.edges:
            source = edge.get("source")
            target = edge.get("target")

            if source not in step_ids:
                raise DAGValidationError(f"Invalid edge source: {source}")
            if target not in step_ids:
                raise DAGValidationError(f"Invalid edge target: {target}")

        if self._has_cycles():
            raise DAGValidationError("Workflow contains circular dependencies")

    def _has_cycles(self) -> bool:
        adj_list = self._build_adjacency_list()
        visited = set()
        rec_stack = set()

        def dfs(node):
            visited.add(node)
            rec_stack.add(node)

            for neighbor in adj_list.get(node, []):
                if neighbor not in visited:
                    if dfs(neighbor):
                        return True
                elif neighbor in rec_stack:
                    return True

            rec_stack.remove(node)
            return False

        for step_id in {step["id"] for step in self.steps}:
            if step_id not in visited:
                if dfs(step_id):
                    return True

        return False

    def _build_adjacency_list(self) -> Dict[str, List[str]]:
        adj_list = {}
        for step in self.steps:
            adj_list[step["id"]] = []

        for edge in self.edges:
            adj_list[edge["source"]].append(edge["target"])

        return adj_list

    def get_execution_order(self) -> List[str]:
        adj_list = self._build_adjacency_list()
        in_degree = {step["id"]: 0 for step in self.steps}

        for node in adj_list:
            for neighbor in adj_list[node]:
                in_degree[neighbor] += 1

        queue = [step_id for step_id in in_degree if in_degree[step_id] == 0]
        execution_order = []

        while queue:
            node = queue.pop(0)
            execution_order.append(node)

            for neighbor in adj_list[node]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        if len(execution_order) != len(self.steps):
            raise DAGValidationError("Could not determine valid execution order")

        return execution_order

    def get_step_by_id(self, step_id: str) -> Dict[str, Any]:
        for step in self.steps:
            if step["id"] == step_id:
                return step
        raise DAGValidationError(f"Step not found: {step_id}")
