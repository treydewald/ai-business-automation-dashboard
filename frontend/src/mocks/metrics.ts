export interface KPIMetrics {
  runsToday: number;
  successRate: number;
  avgDuration: number;
  totalWorkflows: number;
  trends: {
    runsToday: number;
    successRate: number;
    avgDuration: number;
  };
}

export const mockMetrics: KPIMetrics = {
  runsToday: 142,
  successRate: 0.98,
  avgDuration: 4200,
  totalWorkflows: 4,
  trends: {
    runsToday: 23,
    successRate: 2,
    avgDuration: -500,
  },
};

export interface ExecutionMetrics {
  workflowId: string;
  date: string;
  runsToday: number;
  successCount: number;
  failureCount: number;
  skipCount: number;
  successRate: number;
  avgDuration: number;
  medianDuration: number;
  p95Duration: number;
  p99Duration: number;
  topErrors: Array<{ error: string; count: number }>;
  topSteps: Array<{ stepName: string; avgDuration: number }>;
}

export const mockExecutionMetrics: ExecutionMetrics = {
  workflowId: 'wf-lead-intake',
  date: '2026-06-07',
  runsToday: 142,
  successCount: 139,
  failureCount: 3,
  skipCount: 0,
  successRate: 0.98,
  avgDuration: 4200,
  medianDuration: 3900,
  p95Duration: 8100,
  p99Duration: 12400,
  topErrors: [
    { error: 'Integration timeout', count: 2 },
    { error: 'Invalid input format', count: 1 },
  ],
  topSteps: [
    { stepName: 'Classify Intent', avgDuration: 1400 },
    { stepName: 'Enrich Data', avgDuration: 1200 },
    { stepName: 'Route to Team', avgDuration: 800 },
  ],
};

export default {
  metrics: mockMetrics,
  executionMetrics: mockExecutionMetrics,
};
