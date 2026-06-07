import React from 'react';
import { Handle, Position } from 'reactflow';
import { useSelection } from '../contexts/SelectionContext';
import type { WorkflowNode } from '../utils/dagValidation';

interface StepNodeProps {
  data: {
    node: WorkflowNode;
    onSelect: (nodeId: string) => void;
    onDelete: (nodeId: string) => void;
  };
}

const STEP_TYPE_COLORS: Record<string, string> = {
  action: 'bg-blue-100 border-blue-400',
  webhook: 'bg-purple-100 border-purple-400',
  email: 'bg-green-100 border-green-400',
  slack: 'bg-blue-100 border-blue-400',
  condition: 'bg-yellow-100 border-yellow-400',
  loop: 'bg-orange-100 border-orange-400',
  parallel: 'bg-pink-100 border-pink-400',
};

export const StepNode: React.FC<StepNodeProps> = ({ data }) => {
  const { node, onSelect, onDelete } = data;
  const { selectedNodeId } = useSelection();
  const isSelected = selectedNodeId === node.id;
  const colorClass = STEP_TYPE_COLORS[node.type] || 'bg-gray-100 border-gray-400';

  return (
    <div
      className={`
        px-4 py-2 rounded-lg border-2 cursor-pointer transition-all
        ${colorClass}
        ${isSelected ? 'ring-2 ring-offset-2 ring-blue-500 shadow-lg' : 'shadow'}
        hover:shadow-md
      `}
      onClick={() => onSelect(node.id)}
      style={{ minWidth: '150px' }}
    >
      <Handle type="target" position={Position.Top} />

      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-sm font-semibold text-gray-800">{node.name}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node.id);
          }}
          className="text-xs text-red-600 hover:text-red-800 font-bold"
        >
          ×
        </button>
      </div>

      <span className="text-xs text-gray-600 bg-white bg-opacity-50 px-2 py-0.5 rounded">
        {node.type}
      </span>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};
