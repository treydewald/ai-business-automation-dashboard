import type { Workflow } from '@hooks/useWorkflows';
import { Card } from './Card';
import { Badge } from './Badge';

interface WorkflowMetadataProps {
  workflow: Workflow;
}

export function WorkflowMetadata({ workflow }: WorkflowMetadataProps) {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="mb-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{workflow.name}</h1>
          <p className="text-gray-600 mt-2">{workflow.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase">Status</p>
            <div className="mt-2">
              <Badge variant={getStatusColor(workflow.status)}>
                {workflow.status}
              </Badge>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500 uppercase">Created</p>
            <p className="mt-2 text-sm text-gray-900">{formatDate(workflow.created_at)}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500 uppercase">Last Updated</p>
            <p className="mt-2 text-sm text-gray-900">{formatDate(workflow.updated_at)}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
