import { useMemo } from 'react';

export interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  status?: 'completed' | 'running' | 'pending' | 'failed' | 'skipped';
}

interface WorkflowGraphViewProps {
  steps: WorkflowStep[];
  currentStepId?: string;
  className?: string;
}

export function WorkflowGraphView({
  steps,
  currentStepId,
  className = '',
}: WorkflowGraphViewProps) {
  const { nodes, width, height } = useMemo(() => {
    const padding = 60;
    const nodeRadius = 28;
    const nodeSpacing = 140;

    // Horizontal layout
    const w = Math.max(550, steps.length * nodeSpacing + padding * 2);
    const h = 240;

    const nodeList = steps.map((step, index) => ({
      ...step,
      x: padding + index * nodeSpacing + nodeRadius + 50,
      y: h / 2,
    }));

    return { nodes: nodeList, width: w, height: h };
  }, [steps]);

  const getNodeColor = (step: WorkflowStep): string => {
    const isRunning = step.id === currentStepId;
    const isCurrent = step.status === 'running' || isRunning;

    if (step.status === 'completed') return '#34D399'; // neon-success
    if (isCurrent) return '#22D3EE'; // neon-accent
    if (step.status === 'failed') return '#F87171'; // neon-danger
    if (step.status === 'skipped') return '#A0AEC0'; // gray
    return '#4B5563'; // pending/idle gray
  };

  const getNodeGlow = (step: WorkflowStep): string => {
    const isRunning = step.id === currentStepId;
    const isCurrent = step.status === 'running' || isRunning;

    if (isCurrent) return '0 0 30px rgba(34, 211, 238, 1)';
    if (step.status === 'completed') return '0 0 16px rgba(52, 211, 153, 0.6)';
    if (step.status === 'failed') return '0 0 16px rgba(248, 113, 113, 0.6)';
    return 'none';
  };

  const getBorderColor = (step: WorkflowStep): string => {
    const isRunning = step.id === currentStepId;
    const isCurrent = step.status === 'running' || isRunning;

    if (isCurrent) return '#22D3EE';
    if (step.status === 'completed') return '#34D399';
    if (step.status === 'failed') return '#F87171';
    return 'rgba(100, 116, 139, 0.4)';
  };

  return (
    <div className={`w-full bg-gradient-to-b from-neon-surface-hover to-neon-surface rounded-2xl p-8 border-2 border-neon-divider ${className}`}
      style={{
        boxShadow: '0 0 24px rgba(34, 211, 238, 0.15)',
      }}
    >
      <div className="overflow-x-auto pb-2">
        <svg
          width={Math.min(width, 650)}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          className="mx-auto"
          style={{ filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.1))' }}
        >
          {/* Edge lines */}
          {nodes.map((node, index) => {
            if (index === nodes.length - 1) return null;
            const nextNode = nodes[index + 1];
            return (
              <line
                key={`edge-${node.id}-${nextNode.id}`}
                x1={node.x + 28}
                y1={node.y}
                x2={nextNode.x - 28}
                y2={nextNode.y}
                stroke="rgba(99, 102, 241, 0.4)"
                strokeWidth="3"
                strokeLinecap="round"
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node, idx) => {
            const color = getNodeColor(node);
            const glow = getNodeGlow(node);
            const borderColor = getBorderColor(node);
            const isRunning = node.id === currentStepId || node.status === 'running';
            const isCompleted = node.status === 'completed';
            const isFailed = node.status === 'failed';

            return (
              <g key={node.id}>
                {/* Large outer glow circle (for running state) */}
                {isRunning && (
                  <>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={55}
                      fill="none"
                      stroke="#22D3EE"
                      strokeWidth="1"
                      opacity="0.2"
                    />
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={48}
                      fill="none"
                      stroke="#22D3EE"
                      strokeWidth="1.5"
                      opacity="0.35"
                      className="animate-pulse"
                    />
                  </>
                )}

                {/* Node circle with stronger shadow */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={28}
                  fill={color}
                  stroke={borderColor}
                  strokeWidth="3"
                  style={{
                    filter: glow !== 'none' ? `drop-shadow(${glow})` : 'drop-shadow(0 0 4px rgba(0,0,0,0.5))',
                    transition: 'all 300ms ease-in-out',
                  }}
                />

                {/* Status icon inside node */}
                <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isRunning || isCompleted || isFailed ? '#0B1020' : '#F8FAFC'}
                  fontSize="18"
                  fontWeight="bold"
                  letterSpacing="0"
                >
                  {isCompleted && '✓'}
                  {isFailed && '✗'}
                  {!isCompleted && !isFailed && <tspan>{idx + 1}</tspan>}
                </text>

                {/* Step label below node */}
                <text
                  x={node.x}
                  y={node.y + 52}
                  textAnchor="middle"
                  fill="#CBD5E1"
                  fontSize="12"
                  fontWeight="600"
                  letterSpacing="0.5"
                >
                  <tspan>{node.name.substring(0, 16)}</tspan>
                </text>

                {/* Status label if running */}
                {isRunning && (
                  <g>
                    <rect
                      x={node.x - 28}
                      y={node.y - 62}
                      width="56"
                      height="20"
                      rx="4"
                      fill="#22D3EE"
                      opacity="0.2"
                      stroke="#22D3EE"
                      strokeWidth="1"
                    />
                    <text
                      x={node.x}
                      y={node.y - 48}
                      textAnchor="middle"
                      fill="#22D3EE"
                      fontSize="11"
                      fontWeight="700"
                      letterSpacing="1"
                    >
                      RUNNING
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Enhanced Legend */}
      <div className="mt-6 flex flex-wrap gap-6 text-xs text-neon-text-secondary border-t-2 border-neon-divider pt-4 justify-center">
        <div className="flex items-center gap-2.5">
          <div className="w-3.5 h-3.5 rounded-full bg-neon-success shadow-glow-cyan" />
          <span className="font-semibold">Completed</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-3.5 h-3.5 rounded-full bg-neon-accent shadow-glow-cyan animate-pulse" />
          <span className="font-semibold">Running</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-3.5 h-3.5 rounded-full bg-gray-500" />
          <span className="font-semibold">Pending</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-3.5 h-3.5 rounded-full bg-neon-danger shadow-glow-red" />
          <span className="font-semibold">Failed</span>
        </div>
      </div>
    </div>
  );
}

export default WorkflowGraphView;
