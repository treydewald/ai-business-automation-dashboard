import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@components/Button';
import { Card } from '@components/Card';
import { Badge } from '@components/Badge';
import { Spinner } from '@components/Spinner';
import { LogViewer } from '@components/LogViewer';

interface ExecutionDetail {
  id: string;
  workflow_id: string;
  workflow_name: string;
  status: string;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  result?: string;
  steps_executed?: number;
  steps_passed?: number;
  steps_failed?: number;
}

export function ExecutionDetailsPage() {
  const { executionId = '' } = useParams<{ executionId: string }>();
  const navigate = useNavigate();
  const [execution, setExecution] = useState<ExecutionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!executionId) return;
    setLoading(true);
    setError(null);
    try {
      const execRes = await fetch(`/api/executions/${executionId}`);
      if (!execRes.ok) throw new Error('Failed to load execution');
      const execData = await execRes.json();
      setExecution(execData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [executionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusVariant = (status: string): 'success' | 'error' | 'warning' | 'default' => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'running': return 'warning';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString();

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '—';
    if (seconds < 60) return `${seconds}s`;
    return `${Math.round(seconds / 60)}m ${seconds % 60}s`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (error || !execution) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <p className="text-red-800">{error || 'Execution not found'}</p>
          <Button variant="primary" onClick={() => navigate('/executions')} className="mt-4">
            Back to Executions
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/executions')}>
            ← Back to Executions
          </Button>
          <Button variant="secondary" onClick={fetchData}>
            Refresh
          </Button>
        </div>

        {/* Summary */}
        <Card className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{execution.workflow_name}</h1>
              <p className="text-sm font-mono text-gray-500 mt-1">Execution ID: {execution.id}</p>
            </div>
            <Badge variant={getStatusVariant(execution.status)}>
              {execution.status}
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500 uppercase text-xs font-semibold mb-1">Started</p>
              <p className="text-gray-900">{formatDate(execution.started_at)}</p>
            </div>
            <div>
              <p className="text-gray-500 uppercase text-xs font-semibold mb-1">Completed</p>
              <p className="text-gray-900">{execution.completed_at ? formatDate(execution.completed_at) : '—'}</p>
            </div>
            <div>
              <p className="text-gray-500 uppercase text-xs font-semibold mb-1">Duration</p>
              <p className="text-gray-900">{formatDuration(execution.duration_seconds)}</p>
            </div>
            <div>
              <p className="text-gray-500 uppercase text-xs font-semibold mb-1">Result</p>
              <p className="text-gray-900">{execution.result || '—'}</p>
            </div>
          </div>
          {execution.steps_executed !== undefined && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500 uppercase text-xs font-semibold mb-1">Steps Executed</p>
                <p className="text-gray-900 font-semibold">{execution.steps_executed}</p>
              </div>
              <div>
                <p className="text-gray-500 uppercase text-xs font-semibold mb-1">Steps Passed</p>
                <p className="text-green-600 font-semibold">{execution.steps_passed}</p>
              </div>
              <div>
                <p className="text-gray-500 uppercase text-xs font-semibold mb-1">Steps Failed</p>
                <p className={`font-semibold ${execution.steps_failed ? 'text-red-600' : 'text-gray-900'}`}>
                  {execution.steps_failed}
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Logs */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Execution Logs</h2>
          <LogViewer executionId={executionId} />
        </Card>
      </div>
    </div>
  );
}
