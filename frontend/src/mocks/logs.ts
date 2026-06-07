export interface ExecutionLog {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error' | 'debug';
  message: string;
  source: string;
  stepId?: string;
  metadata?: Record<string, unknown>;
}

export const mockLogs: ExecutionLog[] = [
  {
    id: 'log-001',
    timestamp: '2026-06-07T14:23:00Z',
    level: 'info',
    message: 'Execution started for workflow: Lead Intake Pipeline',
    source: 'engine',
  },
  {
    id: 'log-002',
    timestamp: '2026-06-07T14:23:01Z',
    level: 'success',
    message: 'Step 1 completed: Received lead from API',
    source: 'webhook-handler',
    stepId: 'step-1',
    metadata: { leadId: 'lead-456', email: 'john@example.com', statusCode: 200 },
  },
  {
    id: 'log-003',
    timestamp: '2026-06-07T14:23:02Z',
    level: 'info',
    message: 'Step 2 starting: Classify Intent',
    source: 'classifier-service',
    stepId: 'step-2',
  },
  {
    id: 'log-004',
    timestamp: '2026-06-07T14:23:03Z',
    level: 'success',
    message: 'Classification complete: HIGH_INTENT (confidence: 0.94)',
    source: 'classifier-service',
    stepId: 'step-2',
    metadata: { classification: 'HIGH_INTENT', confidence: 0.94, processingTime: 1200 },
  },
  {
    id: 'log-005',
    timestamp: '2026-06-07T14:23:04Z',
    level: 'info',
    message: 'Step 3 starting: Enrich Data',
    source: 'crm-enrichment',
    stepId: 'step-3',
  },
  {
    id: 'log-006',
    timestamp: '2026-06-07T14:23:05Z',
    level: 'success',
    message: 'Data enrichment successful: Added 5 new fields',
    source: 'crm-enrichment',
    stepId: 'step-3',
    metadata: { fieldsAdded: 5, crmId: 'crm-12345', lookupTime: 1100 },
  },
  {
    id: 'log-007',
    timestamp: '2026-06-07T14:23:06Z',
    level: 'info',
    message: 'Step 4 starting: Route to Team',
    source: 'routing-engine',
    stepId: 'step-4',
  },
  {
    id: 'log-008',
    timestamp: '2026-06-07T14:23:07Z',
    level: 'success',
    message: 'Lead routed to Sales Team (queue: sales-priority)',
    source: 'routing-engine',
    stepId: 'step-4',
    metadata: { team: 'Sales', queue: 'sales-priority', routingTime: 50 },
  },
  {
    id: 'log-009',
    timestamp: '2026-06-07T14:23:08Z',
    level: 'info',
    message: 'Step 5 starting: Send Notification',
    source: 'notification-service',
    stepId: 'step-5',
  },
  {
    id: 'log-010',
    timestamp: '2026-06-07T14:23:09Z',
    level: 'success',
    message: 'Slack notification sent to #sales-leads',
    source: 'notification-service',
    stepId: 'step-5',
    metadata: { channel: 'sales-leads', messageId: 'msg-98765', deliveryTime: 200 },
  },
  {
    id: 'log-011',
    timestamp: '2026-06-07T14:23:10Z',
    level: 'success',
    message: 'Execution completed successfully in 10.2 seconds',
    source: 'engine',
    metadata: { totalDuration: 10200, stepsCompleted: 5, status: 'success' },
  },
];

// Function to generate logs for a live simulation
export function generateLiveLog(stepNumber: number): ExecutionLog {
  const steps = [
    {
      message: 'Lead received from API: john@example.com',
      source: 'webhook-handler',
      level: 'success' as const,
    },
    {
      message: 'Classification: HIGH_INTENT (confidence: 0.94)',
      source: 'classifier-service',
      level: 'success' as const,
    },
    {
      message: 'Enriching with CRM data...',
      source: 'crm-enrichment',
      level: 'info' as const,
    },
    {
      message: 'Routed to Sales Team',
      source: 'routing-engine',
      level: 'success' as const,
    },
    {
      message: 'Slack notification sent',
      source: 'notification-service',
      level: 'success' as const,
    },
  ];

  const step = steps[stepNumber] || steps[0];
  const now = new Date();
  const timestamp = now.toISOString();

  return {
    id: `log-live-${stepNumber}-${Date.now()}`,
    timestamp,
    level: step.level,
    message: step.message,
    source: step.source,
    stepId: `step-${stepNumber + 1}`,
  };
}

export default mockLogs;
