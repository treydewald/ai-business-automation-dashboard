/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from 'react';
import { api } from '@services/api';
import type { Execution } from './useExecutions';

interface UseExecutionResult {
  data: Execution | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useExecution(id: string): UseExecutionResult {
  const [data, setData] = useState<Execution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExecution = useCallback(async () => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const result = await api.get<Execution>(`/executions/${id}`);
    if (result.error) {
      setError(result.error.message);
      setData(null);
    } else {
      setData(result.data || null);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchExecution();
  }, [fetchExecution]);

  return {
    data,
    loading,
    error,
    refetch: fetchExecution,
  };
}
