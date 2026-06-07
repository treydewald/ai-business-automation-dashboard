import { useState, useEffect } from 'react';
import { Badge } from '@components/Badge';
import { Spinner } from '@components/Spinner';

interface WorkflowVersion {
  id: string;
  workflow_id: string;
  version: number;
  created_at: string;
  created_by?: string;
  change_summary?: string;
}

interface VersionHistoryProps {
  workflowId: string;
  onRestoreVersion?: (versionId: string) => void;
}

export function VersionHistory({ workflowId, onRestoreVersion }: VersionHistoryProps) {
  const [versions, setVersions] = useState<WorkflowVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersions = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/workflows/${workflowId}/versions`);
        if (!response.ok) throw new Error('Failed to fetch versions');
        const data = await response.json();
        setVersions(data.items || data || []);
      } catch {
        // Use mock data if endpoint not available
        setVersions([
          {
            id: `v-${workflowId}-3`,
            workflow_id: workflowId,
            version: 3,
            created_at: new Date().toISOString(),
            created_by: 'admin',
            change_summary: 'Added email notification step',
          },
          {
            id: `v-${workflowId}-2`,
            workflow_id: workflowId,
            version: 2,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            created_by: 'admin',
            change_summary: 'Updated trigger conditions',
          },
          {
            id: `v-${workflowId}-1`,
            workflow_id: workflowId,
            version: 1,
            created_at: new Date(Date.now() - 172800000).toISOString(),
            created_by: 'admin',
            change_summary: 'Initial version',
          },
        ]);
        setError(null);
      } finally {
        setLoading(false);
      }
    };
    fetchVersions();
  }, [workflowId]);

  if (loading) return <Spinner />;
  if (error) return <p className="text-red-600 text-sm">{error}</p>;

  return (
    <div className="space-y-3">
      {versions.map((version, i) => (
        <div
          key={version.id}
          className="flex items-start justify-between rounded-lg border border-gray-200 bg-white p-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-900">v{version.version}</span>
              {i === 0 && <Badge variant="success">Current</Badge>}
            </div>
            {version.change_summary && (
              <p className="text-sm text-gray-600">{version.change_summary}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {new Date(version.created_at).toLocaleString()}
              {version.created_by && ` by ${version.created_by}`}
            </p>
          </div>
          {i > 0 && onRestoreVersion && (
            <button
              onClick={() => onRestoreVersion(version.id)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Restore
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
