import React, { useCallback } from 'react';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  Background,
  Controls,
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

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  nodes: workflowNodes,
  edges: workflowEdges,
  selectedNodeId,
  onNodeSelect,
  onNodeDelete,
  onNodesChange,
  onConnect,
}) => {
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

  const [nodes, , onNodesChangeRF] = useNodesState(initialNodes);
  const [edges, , onEdgesChangeRF] = useEdgesState(initialEdges);

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
    <div style={{ width: '100%', height: '500px' }}>
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
};
