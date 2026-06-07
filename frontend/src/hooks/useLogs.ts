/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from 'react';
import { api } from '@services/api';

export interface ExecutionLog {
  id: string;
  execution_id: string;
  step_name: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

interface UseLogsResult {
  data: ExecutionLog[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useLogs(executionId?: string): UseLogsResult {
  const [data, setData] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!executionId) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const result = await api.get<{ items: ExecutionLog[] } | ExecutionLog[]>(`/executions/${executionId}/logs`);
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
  }, [executionId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    data,
    loading,
    error,
    refetch: fetchLogs,
  };
}
