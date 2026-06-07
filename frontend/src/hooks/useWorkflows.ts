/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from 'react';
import { api } from '@services/api';

export interface Workflow {
  id: string;
  name: string;
  description: string;
  definition: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface UseWorkflowsResult {
  data: Workflow[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useWorkflows(): UseWorkflowsResult {
  const [data, setData] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await api.get<{ items: Workflow[] } | Workflow[]>('/workflows');
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
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  return {
    data,
    loading,
    error,
    refetch: fetchWorkflows,
  };
}
