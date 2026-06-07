import { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { WorkflowGraphView } from '@components/WorkflowGraphView';
import { ExecutionLogViewer } from '@components/ExecutionLogViewer';
import { KPIStatsCards } from '@components/KPIStatsCards';
import { Button } from '@components/Button';
import { mockWorkflows, type Workflow } from '@mocks/workflows';
import { mockLogs, generateLiveLog, type ExecutionLog } from '@mocks/logs';
import { mockMetrics } from '@mocks/metrics';

export function VisualizationDashboard() {
  const navigate = useNavigate();
  const { workflowId = 'wf-lead-intake' } = useParams();

  const [isExecuting, setIsExecuting] = useState(false);
  const [currentLogs, setCurrentLogs] = useState<ExecutionLog[]>(mockLogs);
  const [executionProgress, setExecutionProgress] = useState<{
    [key: string]: 'completed' | 'running' | 'pending' | 'failed';
  }>({
    'step-1': 'completed',
    'step-2': 'running',
    'step-3': 'pending',
    'step-4': 'pending',
    'step-5': 'pending',
  });

  // Get workflow data
  const workflow: Workflow = mockWorkflows.find((w) => w.id === workflowId) || mockWorkflows[0];
  const updatedSteps = workflow.steps.map((step) => ({
    ...step,
    status: (executionProgress[step.id] || 'pending') as 'completed' | 'running' | 'pending' | 'failed',
  }));

  // Simulate workflow execution
  const handleRunWorkflow = useCallback(() => {
    if (isExecuting) return;

    setIsExecuting(true);
    setCurrentLogs([]);
    setExecutionProgress({
      'step-1': 'completed',
      'step-2': 'running',
      'step-3': 'pending',
      'step-4': 'pending',
      'step-5': 'pending',
    });

    let stepIndex = 0;
    const stepIds = workflow.steps.map((s) => s.id);

    const executeStep = () => {
      if (stepIndex < stepIds.length) {
        const currentStepId = stepIds[stepIndex];

        // Add log entry
        const newLog = generateLiveLog(stepIndex);
        setCurrentLogs((prev) => [...prev, newLog]);

        // Update step status
        setExecutionProgress((prev) => {
          const newProgress = { ...prev };
          newProgress[currentStepId] = 'completed';
          if (stepIndex + 1 < stepIds.length) {
            newProgress[stepIds[stepIndex + 1]] = 'running';
          }
          return newProgress;
        });

        stepIndex++;
        setTimeout(executeStep, 1500);
      } else {
        // Execution complete
        const completionLog: ExecutionLog = {
          id: `log-complete-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: 'success',
          message: 'Execution completed successfully in 7.5 seconds',
          source: 'engine',
          metadata: { totalDuration: 7500, stepsCompleted: 5, status: 'success' },
        };
        setCurrentLogs((prev) => [...prev, completionLog]);
        setIsExecuting(false);
      }
    };

    // Initial log entry
    const startLog: ExecutionLog = {
      id: `log-start-${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Execution started for workflow: ${workflow.name}`,
      source: 'engine',
    };
    setCurrentLogs([startLog]);

    setTimeout(executeStep, 1000);
  }, [isExecuting, workflow]);

  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      {/* Background grid is applied via globals.css */}

      {/* Header / Topbar */}
      <div className="sticky top-0 z-40 border-b-2 border-neon-divider bg-neon-bg/95 backdrop-blur-glass">
        <div className="px-8 py-5 max-w-full">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => navigate('/workflows')}
                className="text-neon-text-secondary hover:text-neon-accent transition font-bold text-lg"
              >
                ←
              </button>
              <div>
                <h1 className="text-3xl font-black text-neon-text leading-none">{workflow.name}</h1>
                <p className="text-sm text-neon-text-secondary mt-1">
                  {workflow.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  workflow.status === 'active'
                    ? 'bg-neon-success/25 text-neon-success border border-neon-success/40 shadow-glow-cyan'
                    : 'bg-neon-text-secondary/20 text-neon-text-secondary border border-neon-text-secondary/30'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-current animate-pulse"></span>
                {workflow.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-8 max-w-full">
        {/* KPI Cards - Visible at top */}
        <div className="mb-10">
          <h2 className="text-xl font-black text-neon-text mb-6 tracking-wide">DASHBOARD METRICS</h2>
          <KPIStatsCards
            runsToday={mockMetrics.runsToday}
            successRate={mockMetrics.successRate}
            avgDuration={mockMetrics.avgDuration}
            totalWorkflows={4}
            trends={mockMetrics.trends}
          />
        </div>

        {/* Main Layout: Graph + Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Left: Workflow Graph (Hero component) */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-xl font-black text-neon-text mb-4 tracking-wide">WORKFLOW EXECUTION</h2>
              <div className="flex gap-3 mb-6">
                <Button
                  onClick={handleRunWorkflow}
                  disabled={isExecuting}
                  className={`text-base font-bold px-6 py-3 ${
                    isExecuting
                      ? 'opacity-50 cursor-not-allowed'
                      : 'bg-neon-primary hover:shadow-glow-indigo hover:scale-105'
                  } transition-all duration-200`}
                >
                  {isExecuting ? '▶ Running...' : '▶ Run Now'}
                </Button>
                <Button
                  onClick={() => navigate(`/workflows/${workflow.id}/edit`)}
                  variant="secondary"
                  className="text-base font-bold px-6 py-3 hover:scale-105 transition-all duration-200"
                >
                  ✎ Edit
                </Button>
              </div>
            </div>

            {/* Workflow Graph */}
            <WorkflowGraphView steps={updatedSteps} currentStepId="step-2" />
          </div>

          {/* Right: Workflow Details */}
          <div>
            <h2 className="text-xl font-black text-neon-text mb-4 tracking-wide">DETAILS</h2>
            <div className="rounded-2xl p-6 space-y-6 border-2 border-neon-divider"
              style={{
                background: 'linear-gradient(135deg, rgba(20, 30, 60, 0.95) 0%, rgba(20, 30, 60, 0.9) 100%)',
                boxShadow: '0 0 16px rgba(34, 211, 238, 0.08)',
              }}
            >
              {/* Triggers */}
              <div>
                <h3 className="text-xs font-black text-neon-accent uppercase mb-3 tracking-wider">
                  Triggers
                </h3>
                <div className="space-y-2">
                  {workflow.triggers.map((trigger: any, idx: number) => (
                    <div
                      key={idx}
                      className="text-xs bg-neon-surface-hover rounded-lg px-3 py-2 border-l-3 border-neon-accent"
                    >
                      <div className="font-bold text-neon-accent uppercase tracking-wider">
                        {trigger.type}
                      </div>
                      {trigger.config && (
                        <div className="text-neon-text-secondary font-mono text-xs mt-2 bg-black/30 rounded px-2 py-1">
                          {trigger.config}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="border-t-2 border-neon-divider pt-4">
                <h3 className="text-xs font-black text-neon-accent uppercase mb-3 tracking-wider">
                  Statistics
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center px-2 py-1.5 rounded-lg hover:bg-neon-surface-hover transition-colors">
                    <span className="text-neon-text-secondary font-semibold">Total Runs</span>
                    <span className="font-black text-neon-text text-lg">{workflow.totalRuns}</span>
                  </div>
                  <div className="flex justify-between items-center px-2 py-1.5 rounded-lg hover:bg-neon-surface-hover transition-colors">
                    <span className="text-neon-text-secondary font-semibold">Success Rate</span>
                    <span className="font-black text-neon-success text-lg">
                      {(workflow.successRate * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center px-2 py-1.5 rounded-lg hover:bg-neon-surface-hover transition-colors">
                    <span className="text-neon-text-secondary font-semibold">Last Run</span>
                    <span className="font-black text-neon-text">
                      {workflow.lastRun
                        ? new Date(workflow.lastRun).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                        : 'Never'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Owner */}
              <div className="border-t-2 border-neon-divider pt-4">
                <h3 className="text-xs font-black text-neon-accent uppercase mb-3 tracking-wider">
                  Owner
                </h3>
                <div className="text-xs text-neon-text font-semibold bg-neon-surface-hover rounded-lg px-3 py-2">
                  {workflow.owner}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Execution Logs - Full width below */}
        <div>
          <h2 className="text-xl font-black text-neon-text mb-4 tracking-wide">LIVE EXECUTION LOG</h2>
          <div style={{ height: '350px' }}>
            <ExecutionLogViewer logs={currentLogs} isLive={isExecuting} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default VisualizationDashboard;
