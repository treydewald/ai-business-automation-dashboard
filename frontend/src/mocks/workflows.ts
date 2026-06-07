export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  owner: string;
  lastRun: string | null;
  lastStatus: 'success' | 'failed' | 'pending' | null;
  totalRuns: number;
  successRate: number;
  triggers: Array<{ type: 'api' | 'schedule' | 'manual'; config?: string }>;
  steps: Array<{
    id: string;
    name: string;
    type: string;
    status?: 'completed' | 'running' | 'pending' | 'failed';
  }>;
}

export const mockWorkflows: Workflow[] = [
  {
    id: 'wf-lead-intake',
    name: 'Lead Intake Pipeline',
    description: 'Processes incoming leads through classification and routing',
    status: 'active',
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-06-07T14:00:00Z',
    owner: 'ops-team@company.com',
    lastRun: '2026-06-07T14:23:00Z',
    lastStatus: 'success',
    totalRuns: 142,
    successRate: 0.98,
    triggers: [
      { type: 'api', config: '/webhooks/leads' },
      { type: 'schedule', config: '0 9 * * *' },
    ],
    steps: [
      { id: 'step-1', name: 'Receive Lead', type: 'webhook', status: 'completed' },
      { id: 'step-2', name: 'Classify Intent', type: 'integration', status: 'running' },
      { id: 'step-3', name: 'Enrich Data', type: 'integration', status: 'pending' },
      { id: 'step-4', name: 'Route to Team', type: 'conditional', status: 'pending' },
      { id: 'step-5', name: 'Send Notification', type: 'notification', status: 'pending' },
    ],
  },
  {
    id: 'wf-email-notify',
    name: 'Email Notification System',
    description: 'Sends automated email notifications based on workflow triggers',
    status: 'active',
    createdAt: '2026-04-15T10:30:00Z',
    updatedAt: '2026-06-06T12:15:00Z',
    owner: 'ops-team@company.com',
    lastRun: '2026-06-07T12:00:00Z',
    lastStatus: 'success',
    totalRuns: 89,
    successRate: 0.99,
    triggers: [{ type: 'manual' }],
    steps: [
      { id: 'step-1', name: 'Validate Email', type: 'validation' },
      { id: 'step-2', name: 'Build Email', type: 'integration' },
      { id: 'step-3', name: 'Send Email', type: 'notification' },
    ],
  },
  {
    id: 'wf-crm-sync',
    name: 'CRM Data Synchronization',
    description: 'Syncs workflow data with CRM system',
    status: 'active',
    createdAt: '2026-03-20T08:45:00Z',
    updatedAt: '2026-06-05T15:30:00Z',
    owner: 'integration-team@company.com',
    lastRun: '2026-06-07T11:45:00Z',
    lastStatus: 'success',
    totalRuns: 312,
    successRate: 0.96,
    triggers: [{ type: 'schedule', config: '*/15 * * * *' }],
    steps: [
      { id: 'step-1', name: 'Fetch Data', type: 'webhook' },
      { id: 'step-2', name: 'Transform', type: 'integration' },
      { id: 'step-3', name: 'Sync to CRM', type: 'integration' },
      { id: 'step-4', name: 'Log Result', type: 'notification' },
    ],
  },
  {
    id: 'wf-data-export',
    name: 'Daily Data Export',
    description: 'Exports daily workflow metrics and execution logs',
    status: 'inactive',
    createdAt: '2026-02-10T14:20:00Z',
    updatedAt: '2026-06-01T09:00:00Z',
    owner: 'analytics-team@company.com',
    lastRun: '2026-06-05T23:30:00Z',
    lastStatus: 'success',
    totalRuns: 45,
    successRate: 1.0,
    triggers: [{ type: 'schedule', config: '0 0 * * *' }],
    steps: [
      { id: 'step-1', name: 'Gather Metrics', type: 'webhook' },
      { id: 'step-2', name: 'Format Data', type: 'integration' },
      { id: 'step-3', name: 'Generate Report', type: 'integration' },
      { id: 'step-4', name: 'Export to S3', type: 'notification' },
    ],
  },
];

export default mockWorkflows;
