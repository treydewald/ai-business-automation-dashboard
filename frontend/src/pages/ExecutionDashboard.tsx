import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ChangeEvent } from 'react';
import type { Execution } from '../types';
import { Button } from '@components/Button';
import { Card } from '@components/Card';
import { Select } from '@components/Form/Select';
import { Spinner } from '@components/Spinner';
import { Badge } from '@components/Badge';

export function ExecutionDashboard() {
  const navigate = useNavigate();
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [workflowFilter, setWorkflowFilter] = useState<string>('');

  const fetchExecutions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/executions?limit=50');
      if (!response.ok) throw new Error('Failed to load executions');
      const data = await response.json();
      setExecutions(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExecutions();
    const interval = setInterval(fetchExecutions, 5000);
    return () => clearInterval(interval);
  }, [fetchExecutions]);

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

  const filteredExecutions = useMemo(() => {
    let result = executions;

    if (statusFilter) {
      result = result.filter((e) => e.status === statusFilter);
    }

    if (workflowFilter) {
      result = result.filter((e) => e.workflow_id.includes(workflowFilter));
    }

    return result;
  }, [executions, statusFilter, workflowFilter]);

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <p className="text-red-800">Error loading executions: {error}</p>
          <Button variant="primary" onClick={fetchExecutions} className="mt-4">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Executions</h1>
          <p className="mt-2 text-gray-600">View and manage all workflow executions</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Select
              value={statusFilter}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Status' },
                { value: 'running', label: 'Running' },
                { value: 'completed', label: 'Completed' },
                { value: 'failed', label: 'Failed' },
              ]}
            />
            <input
              type="text"
              placeholder="Filter by workflow ID..."
              value={workflowFilter}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setWorkflowFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </Card>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : filteredExecutions.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-600">No executions found</p>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Workflow</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Started</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Duration</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredExecutions.map((execution) => (
                    <tr key={execution.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">
                        {execution.workflow_id.substring(0, 8)}...
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusColor(execution.status)}>
                          {execution.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(execution.started_at)}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {calculateDuration(execution.started_at, execution.completed_at)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/executions/${execution.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
