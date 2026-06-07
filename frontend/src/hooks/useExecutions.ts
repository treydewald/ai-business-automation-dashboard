/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from 'react';
import { api } from '@services/api';

export interface Execution {
  id: string;
  workflow_id: string;
  status: 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  result?: string;
}

interface UseExecutionsResult {
  data: Execution[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useExecutions(workflowId?: string): UseExecutionsResult {
  const [data, setData] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExecutions = useCallback(async () => {
    setLoading(true);
    setError(null);
    const endpoint = workflowId
      ? `/workflows/${workflowId}/executions`
      : '/executions';
    const result = await api.get<{ items: Execution[] } | Execution[]>(endpoint);
    if (result.error) {
      setError(result.error.message);
      setData([]);
    } else {
      const raw = result.data;
      if (Array.isArray(raw)) {
        setData(raw);
      } else if (raw && 'items' in raw && Array.isArray(raw.items)) {
        setData(raw.items);
      } else {
        setData([]);
      }
    }
    setLoading(false);
  }, [workflowId]);

  useEffect(() => {
    fetchExecutions();
  }, [fetchExecutions]);

  return {
    data,
    loading,
    error,
    refetch: fetchExecutions,
  };
}
