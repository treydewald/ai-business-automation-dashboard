export interface WorkflowNode {
  id: string;
  name: string;
  type: string;
  parameters: Record<string, unknown>;
  position?: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

export interface WorkflowDefinition {
  id?: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  entryPoint: string;
  createdAt?: string;
  updatedAt?: string;
}

export class DAGValidator {
  static validateDAG(nodes: WorkflowNode[], edges: WorkflowEdge[]): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check for cycles using DFS
    if (this.hasCycle(nodes, edges)) {
      errors.push('Workflow contains circular dependencies');
    }

    // Check for missing dependencies
    const nodeIds = new Set(nodes.map(n => n.id));
    for (const edge of edges) {
      if (!nodeIds.has(edge.source)) {
        errors.push(`Source node "${edge.source}" not found`);
      }
      if (!nodeIds.has(edge.target)) {
        errors.push(`Target node "${edge.target}" not found`);
      }
    }

    // Check for isolated nodes (except single-node workflows)
    if (nodes.length > 1) {
      for (const node of nodes) {
        const hasConnection = edges.some(e => e.source === node.id || e.target === node.id);
        if (!hasConnection) {
          errors.push(`Node "${node.id}" is isolated and not connected to the workflow`);
        }
      }
    }

    // Check for valid step types
    const validTypes = ['action', 'webhook', 'email', 'slack', 'condition', 'loop', 'parallel'];
    for (const node of nodes) {
      if (!validTypes.includes(node.type)) {
        errors.push(`Unknown step type: "${node.type}"`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private static hasCycle(nodes: WorkflowNode[], edges: WorkflowEdge[]): boolean {
    const adjacencyList = new Map<string, string[]>();

    // Build adjacency list
    for (const node of nodes) {
      adjacencyList.set(node.id, []);
    }

    for (const edge of edges) {
      const targets = adjacencyList.get(edge.source) || [];
      targets.push(edge.target);
      adjacencyList.set(edge.source, targets);
    }

    // DFS to detect cycle
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    for (const node of nodes) {
      if (this.dfs(node.id, adjacencyList, visited, recursionStack)) {
        return true;
      }
    }

    return false;
  }

  private static dfs(
    node: string,
    adjacencyList: Map<string, string[]>,
    visited: Set<string>,
    recursionStack: Set<string>
  ): boolean {
    visited.add(node);
    recursionStack.add(node);

    const neighbors = adjacencyList.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (this.dfs(neighbor, adjacencyList, visited, recursionStack)) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }

    recursionStack.delete(node);
    return false;
  }

  static getWorkflowExecutionOrder(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): string[] | null {
    // Topological sort to get execution order
    const inDegree = new Map<string, number>();
    const adjacencyList = new Map<string, string[]>();

    for (const node of nodes) {
      inDegree.set(node.id, 0);
      adjacencyList.set(node.id, []);
    }

    for (const edge of edges) {
      const current = inDegree.get(edge.target) || 0;
      inDegree.set(edge.target, current + 1);
      const targets = adjacencyList.get(edge.source) || [];
      targets.push(edge.target);
      adjacencyList.set(edge.source, targets);
    }

    const queue: string[] = [];
    const order: string[] = [];

    for (const [nodeId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(nodeId);
      }
    }

    while (queue.length > 0) {
      const node = queue.shift()!;
      order.push(node);

      const neighbors = adjacencyList.get(node) || [];
      for (const neighbor of neighbors) {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }

    return order.length === nodes.length ? order : null;
  }
}

export const validateWorkflowDefinition = (
  definition: WorkflowDefinition
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!definition.name || definition.name.trim() === '') {
    errors.push('Workflow name is required');
  }

  if (definition.nodes.length === 0) {
    errors.push('Workflow must have at least one step');
  }

  const { valid, errors: dagErrors } = DAGValidator.validateDAG(
    definition.nodes,
    definition.edges
  );

  if (!valid) {
    errors.push(...dagErrors);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
