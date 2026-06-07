import React, { useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  useReactFlow,
} from 'reactflow';
import type { Node, Edge, Connection, NodeChange } from 'reactflow';
import 'reactflow/dist/style.css';
import { StepNode } from './StepNode';
import type { WorkflowNode, WorkflowEdge } from '../utils/dagValidation';

interface WorkflowCanvasProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string) => void;
  onNodeDelete: (nodeId: string) => void;
  onNodesChange: (nodes: WorkflowNode[]) => void;
  onEdgesChange: (edges: WorkflowEdge[]) => void;
  onConnect: (source: string, target: string) => void;
}

const nodeTypes = {
  step: StepNode,
};

export const WorkflowCanvas = React.forwardRef<{fitView: () => void}, WorkflowCanvasProps>(({
  nodes: workflowNodes,
  edges: workflowEdges,
  selectedNodeId,
  onNodeSelect,
  onNodeDelete,
  onNodesChange,
  onConnect,
}, ref) => {
  const reactFlowInstance = useReactFlow();
  const initialNodes: Node[] = workflowNodes.map(node => ({
    id: node.id,
    data: {
      node,
      isSelected: selectedNodeId === node.id,
      onSelect: onNodeSelect,
      onDelete: onNodeDelete,
    },
    position: node.position || { x: Math.random() * 400, y: Math.random() * 400 },
    type: 'step',
  }));

  const initialEdges: Edge[] = workflowEdges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.condition ? `[${edge.condition}]` : undefined,
    animated: true,
  }));

  const [nodes, setNodes, onNodesChangeRF] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeRF] = useEdgesState(initialEdges);

  // Expose fitView method via ref
  React.useImperativeHandle(ref, () => ({
    fitView: () => {
      setTimeout(() => {
        if (reactFlowInstance) {
          reactFlowInstance.fitView({ padding: 0.2 });
        }
      }, 100);
    },
  }), [reactFlowInstance]);

  // Sync ReactFlow nodes and edges when workflow nodes/edges change
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    // Fit view after nodes are set
    setTimeout(() => {
      if (reactFlowInstance && initialNodes.length > 0) {
        reactFlowInstance.fitView({ padding: 0.2 });
      }
    }, 100);
  }, [workflowNodes, workflowEdges, selectedNodeId, setNodes, setEdges, reactFlowInstance]);

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChangeRF(changes);
    const updated = changes.map((change: any) => {
      if (change.type === 'position') {
        return {
          ...workflowNodes.find(n => n.id === change.id),
          position: change.position,
        };
      }
      return null;
    }).filter(Boolean) as WorkflowNode[];

    if (updated.length > 0) {
      const newNodes = workflowNodes.map(n => {
        const updated_node = updated.find(u => u.id === n.id);
        return updated_node ? { ...n, position: updated_node.position } : n;
      });
      onNodesChange(newNodes);
    }
  }, [workflowNodes, onNodesChange, onNodesChangeRF]);

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        onConnect(connection.source, connection.target);
      }
    },
    [onConnect]
  );

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChangeRF}
        onConnect={handleConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
});
