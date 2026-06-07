import type { Workflow } from '@hooks/useWorkflows';
import { Card } from './Card';
import { Badge } from './Badge';

interface WorkflowCardProps {
  workflow: Workflow;
  onClick: () => void;
}

export function WorkflowCard({ workflow, onClick }: WorkflowCardProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusBadge = (status?: string) => {
    const emoji = {
      active: '✓',
      inactive: '—',
    };
    return emoji[status as keyof typeof emoji] || '—';
  };

  const formatDate = (dateString: string) => {
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
            <span className="text-xs font-medium text-gray-500 uppercase">Status</span>
            <Badge variant={getStatusColor(workflow.status)}>
              {getStatusBadge(workflow.status)} {workflow.status}
            </Badge>
          </div>
        </div>

        {/* Created */}
        <div className="border-t border-gray-200 pt-3">
          <p className="text-xs text-gray-500">
            Created {formatDate(workflow.created_at)}
          </p>
        </div>
      </div>
    </Card>
  );
}
