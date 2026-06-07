export interface Workflow {
  id: string;
  name: string;
  description?: string;
  definition: Record<string, unknown>;
  status?: string;
  created_at: string;
  updated_at: string;
  last_execution_status?: string;
  last_execution_time?: string;
}

export interface Execution {
  id: string;
  workflow_id: string;
  status: 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  result?: Record<string, unknown>;
  error?: string;
}

export interface ExecutionLog {
  id?: string;
  execution_id?: string;
  step: string;
  step_name?: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'info' | 'debug' | 'warn' | 'error';
  message: string;
  timestamp: string;
  context_json?: Record<string, unknown>;
}

export interface Trigger {
  id: string;
  workflow_id: string;
  type: 'manual' | 'webhook' | 'schedule';
  config: Record<string, unknown>;
  created_at: string;
}

export interface ApiResponse<T> {
  data?: T;
  items?: T[];
  total_pages?: number;
  current_page?: number;
  total_count?: number;
  error?: string;
}
