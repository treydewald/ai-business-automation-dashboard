/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from 'react';
import { api } from '@services/api';
import type { Workflow } from './useWorkflows';

interface UseWorkflowResult {
  data: Workflow | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useWorkflow(id: string): UseWorkflowResult {
  const [data, setData] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflow = useCallback(async () => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const result = await api.get<Workflow>(`/workflows/${id}`);
    if (result.error) {
      setError(result.error.message);
      setData(null);
    } else {
      setData(result.data || null);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchWorkflow();
  }, [fetchWorkflow]);

  return {
    data,
    loading,
    error,
    refetch: fetchWorkflow,
  };
}
