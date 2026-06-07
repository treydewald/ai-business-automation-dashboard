import { useState, useCallback, useRef } from 'react';
import type {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowEdge,
} from '../utils/dagValidation';
import { validateWorkflowDefinition } from '../utils/dagValidation';

interface HistoryEntry {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export const useWorkflowEditor = (initialWorkflow?: WorkflowDefinition) => {
  const [nodes, setNodes] = useState<WorkflowNode[]>(
    initialWorkflow?.nodes || []
  );
  const [edges, setEdges] = useState<WorkflowEdge[]>(
    initialWorkflow?.edges || []
  );
  const [name, setName] = useState(initialWorkflow?.name || '');
  const [description, setDescription] = useState(initialWorkflow?.description || '');
  const [entryPoint, setEntryPoint] = useState(initialWorkflow?.entryPoint || '');

  const historyRef = useRef<HistoryEntry[]>([]);
  const historyIndexRef = useRef(-1);

  const addToHistory = useCallback((newNodes: WorkflowNode[], newEdges: WorkflowEdge[]) => {
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push({ nodes: newNodes, edges: newEdges });
    historyIndexRef.current++;
  }, []);

  const addNode = useCallback(
    (node: WorkflowNode) => {
      const newNodes = [...nodes, node];
      setNodes(newNodes);
      addToHistory(newNodes, edges);
    },
    [nodes, edges, addToHistory]
  );

  const updateNode = useCallback(
    (nodeId: string, updates: Partial<WorkflowNode>) => {
      const newNodes = nodes.map(n =>
        n.id === nodeId ? { ...n, ...updates } : n
      );
      setNodes(newNodes);
      addToHistory(newNodes, edges);
    },
    [nodes, edges, addToHistory]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      const newNodes = nodes.filter(n => n.id !== nodeId);
      const newEdges = edges.filter(
        e => e.source !== nodeId && e.target !== nodeId
      );
      setNodes(newNodes);
      setEdges(newEdges);
      addToHistory(newNodes, newEdges);
    },
    [nodes, edges, addToHistory]
  );

  const addEdge = useCallback(
    (source: string, target: string, condition?: string) => {
      const edgeId = `${source}-${target}`;
      const newEdge: WorkflowEdge = {
        id: edgeId,
        source,
        target,
        condition,
      };
      const newEdges = [...edges, newEdge];
      setEdges(newEdges);
      addToHistory(nodes, newEdges);
    },
    [nodes, edges, addToHistory]
  );

  const deleteEdge = useCallback(
    (edgeId: string) => {
      const newEdges = edges.filter(e => e.id !== edgeId);
      setEdges(newEdges);
      addToHistory(nodes, newEdges);
    },
    [nodes, edges, addToHistory]
  );

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const entry = historyRef.current[historyIndexRef.current];
      setNodes(entry.nodes);
      setEdges(entry.edges);
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const entry = historyRef.current[historyIndexRef.current];
      setNodes(entry.nodes);
      setEdges(entry.edges);
    }
  }, []);

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  const getDefinition = useCallback((): WorkflowDefinition => {
    return {
      name,
      description,
      nodes,
      edges,
      entryPoint,
    };
  }, [name, description, nodes, edges, entryPoint]);

  const validate = useCallback(() => {
    return validateWorkflowDefinition(getDefinition());
  }, [getDefinition]);

  return {
    nodes,
    edges,
    name,
    setName,
    description,
    setDescription,
    entryPoint,
    setEntryPoint,
    addNode,
    updateNode,
    deleteNode,
    addEdge,
    deleteEdge,
    undo,
    redo,
    canUndo,
    canRedo,
    getDefinition,
    validate,
  };
};
