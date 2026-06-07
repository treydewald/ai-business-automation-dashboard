import { Workflow } from '../types';
import Card from './Card';
import Badge from './Badge';

interface WorkflowCardProps {
  workflow: Workflow;
  onClick: () => void;
}

const WorkflowCard = ({ workflow, onClick }: WorkflowCardProps) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'running':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusBadge = (status?: string) => {
    const emoji = {
      completed: '✓',
      failed: '✗',
      running: '⏳',
    };
    return emoji[status as keyof typeof emoji] || '—';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg hover:border-blue-300"
      onClick={onClick}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{workflow.name}</h3>
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">{workflow.description}</p>
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase">Last Execution</span>
            {workflow.last_execution_status && (
              <Badge variant={getStatusColor(workflow.last_execution_status)}>
                {getStatusBadge(workflow.last_execution_status)} {workflow.last_execution_status}
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Run Time</span>
            <span className="text-xs font-medium text-gray-700">{formatDate(workflow.last_execution_time)}</span>
          </div>
        </div>

        {/* Created */}
        <div className="border-t border-gray-200 pt-3">
          <p className="text-xs text-gray-500">
            Created {new Date(workflow.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default WorkflowCard;
