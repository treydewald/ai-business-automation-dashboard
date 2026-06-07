import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Execution } from '../types';
import { Spinner } from './Spinner';
import { Badge } from './Badge';

interface ExecutionListProps {
  workflowId: string;
}

export function ExecutionList({ workflowId }: ExecutionListProps) {
  const navigate = useNavigate();
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExecutions = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/workflows/${workflowId}/executions?limit=10`);
        if (!response.ok) throw new Error('Failed to load executions');
        const data = await response.json();
        setExecutions(Array.isArray(data) ? data : data.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchExecutions();
  }, [workflowId]);

  const getStatusColor = (status: string) => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDuration = (started: string, completed?: string) => {
    if (!completed) return 'Running...';
    const start = new Date(started).getTime();
    const end = new Date(completed).getTime();
    const seconds = Math.round((end - start) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.round(seconds / 60);
    return `${minutes}m`;
  };

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return <p className="text-red-600">Error loading executions: {error}</p>;
  }

  if (executions.length === 0) {
    return <p className="text-gray-500">No executions yet</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Started</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Duration</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Result</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {executions.map((execution) => (
            <tr key={execution.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <Badge variant={getStatusColor(execution.status)}>
                  {execution.status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-gray-600">{formatDate(execution.started_at)}</td>
              <td className="px-4 py-3 text-gray-600">
                {calculateDuration(execution.started_at, execution.completed_at)}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {execution.error ? <span className="text-red-600">Error</span> : '—'}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => navigate(`/executions/${execution.id}`)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
