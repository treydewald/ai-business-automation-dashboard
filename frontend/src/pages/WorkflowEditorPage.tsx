import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WorkflowCanvas } from '../components/WorkflowCanvas';
import { StepConfigPanel } from '../components/StepConfigPanel';
import { Button } from '../components/Button';
import { Input } from '../components/Form/Input';
import { Textarea } from '../components/Form/Textarea';
import { Select } from '../components/Form/Select';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';
import { useWorkflowEditor } from '../hooks/useWorkflowEditor';
import { useWorkflow } from '../hooks/useWorkflow';
import { api } from '../services/api';
import type { WorkflowNode } from '../utils/dagValidation';

const STEP_TYPES = [
  { value: 'action', label: 'Action' },
  { value: 'webhook', label: 'Webhook' },
  { value: 'email', label: 'Email' },
  { value: 'slack', label: 'Slack' },
  { value: 'condition', label: 'Condition' },
  { value: 'loop', label: 'Loop' },
  { value: 'parallel', label: 'Parallel' },
];

// Inner component: only rendered once the initial workflow data is ready
const WorkflowEditorContent: React.FC<{ workflowId?: string; initialWorkflow?: any }> = ({
  workflowId,
  initialWorkflow,
}) => {
  const navigate = useNavigate();
  const [selectedStepType, setSelectedStepType] = useState('action');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const initializeRef = React.useRef(false);

  const editor = useWorkflowEditor(initialWorkflow);

  // Initialize demo workflow on first load (if no initial workflow provided)
  React.useEffect(() => {
    // Show demo workflow when loading wf-lead-intake without actual backend data
    if (!initialWorkflow && editor.nodes.length === 0 && !initializeRef.current) {
      initializeRef.current = true;
      // Set demo workflow name and description
      editor.setName('Enterprise Lead Processing Pipeline');
      editor.setDescription('A comprehensive workflow that receives B2B leads, validates data quality, applies ML scoring, routes by fit, and orchestrates multi-channel engagement across Slack, email, and CRM systems.');

      // Define demo steps with professional portfolio-worthy layout
      const demoSteps: WorkflowNode[] = [
        // Input Layer
        {
          id: 'step-1',
          name: 'Receive Lead via Webhook',
          type: 'webhook',
          parameters: { method: 'POST', path: '/webhooks/crm/leads', auth: 'bearer-token' },
          position: { x: 50, y: 200 },
        },
        // Validation Layer
        {
          id: 'step-2',
          name: 'Validate Email & Phone',
          type: 'action',
          parameters: { validation: 'email,phone,domain', timeout: '5s' },
          position: { x: 280, y: 100 },
        },
        {
          id: 'step-3',
          name: 'Enrich Company Data',
          type: 'action',
          parameters: { source: 'clearbit-api', fields: 'industry,revenue,employees' },
          position: { x: 280, y: 300 },
        },
        // Processing Layer
        {
          id: 'step-4',
          name: 'Calculate Lead Score',
          type: 'action',
          parameters: { model: 'ml-lead-scoring-v3', weights: 'engagement:0.4,fit:0.35,budget:0.25' },
          position: { x: 510, y: 200 },
        },
        // Routing Logic
        {
          id: 'step-5',
          name: 'Score > 80?',
          type: 'condition',
          parameters: { operator: 'gte', field: 'score', value: '80' },
          position: { x: 740, y: 200 },
        },
        // High-Score Path: Premium Sales
        {
          id: 'step-6',
          name: 'Assign to Premium Sales',
          type: 'action',
          parameters: { queue: 'sales-premium', priority: 'high' },
          position: { x: 970, y: 80 },
        },
        {
          id: 'step-7',
          name: 'Notify Sales on Slack',
          type: 'slack',
          parameters: { channel: '#sales-premium-leads', emoji: '🔥', mention: '@sales-lead' },
          position: { x: 1200, y: 80 },
        },
        // Mid-Score Path: Standard Sales
        {
          id: 'step-8',
          name: 'Assign to Sales Rep',
          type: 'action',
          parameters: { queue: 'sales-standard', assignment: 'round-robin' },
          position: { x: 970, y: 200 },
        },
        {
          id: 'step-9',
          name: 'Send Welcome Email',
          type: 'email',
          parameters: { template: 'welcome-sales', campaign: 'outbound-2024' },
          position: { x: 1200, y: 200 },
        },
        // Low-Score Path: Nurture Campaign
        {
          id: 'step-10',
          name: 'Add to Nurture Track',
          type: 'action',
          parameters: { campaign: 'lead-nurture-90day', segment: 'low-fit' },
          position: { x: 970, y: 320 },
        },
        {
          id: 'step-11',
          name: 'Sync to Drip Campaign',
          type: 'email',
          parameters: { platform: 'hubspot', series: 'nurture-sequence' },
          position: { x: 1200, y: 320 },
        },
        // Final logging
        {
          id: 'step-12',
          name: 'Log to Analytics',
          type: 'action',
          parameters: { service: 'segment', event: 'lead_processed', tags: 'crm,sales' },
          position: { x: 1200, y: 200 },
        },
      ];

      // Use a timeout to ensure state updates properly for each node/edge
      let delay = 0;
      demoSteps.forEach((step, index) => {
        setTimeout(() => editor.addNode(step), delay);
        delay += 10;
      });

      // Define connections showing the workflow logic
      const connections = [
        // Main flow: validation -> enrichment
        { source: 'step-1', target: 'step-2' },
        { source: 'step-1', target: 'step-3' },

        // Both validations complete before scoring
        { source: 'step-2', target: 'step-4' },
        { source: 'step-3', target: 'step-4' },

        // Score then route
        { source: 'step-4', target: 'step-5' },

        // High-score path (score >= 80)
        { source: 'step-5', target: 'step-6' },
        { source: 'step-6', target: 'step-7' },

        // Mid-score path (score 60-79)
        { source: 'step-5', target: 'step-8' },
        { source: 'step-8', target: 'step-9' },

        // Low-score path (score < 60)
        { source: 'step-5', target: 'step-10' },
        { source: 'step-10', target: 'step-11' },

        // All paths eventually log
        { source: 'step-7', target: 'step-12' },
        { source: 'step-9', target: 'step-12' },
        { source: 'step-11', target: 'step-12' },
      ];

      // Add all connections with staggered timing
      connections.forEach((conn, index) => {
        setTimeout(() => editor.addEdge(conn.source, conn.target), delay + 200 + (index * 10));
      });

      setSuccess('✨ Professional demo workflow loaded! 12 steps, 3 decision branches, email & Slack integration.');
      setTimeout(() => setSuccess(null), 6000);
    }
  }, [initialWorkflow]);

  const selectedNode = editor.nodes.find(n => n.id === selectedNodeId) || null;

  const addStep = () => {
    const stepName = `${selectedStepType.charAt(0).toUpperCase() + selectedStepType.slice(1)} ${editor.nodes.length + 1}`;
    const newNode: WorkflowNode = {
      id: `step-${Date.now()}`,
      name: stepName,
      type: selectedStepType,
      parameters: {},
    };

    editor.addNode(newNode);
    setSelectedNodeId(newNode.id);
    setSuccess(`Step "${stepName}" added`);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleSave = async () => {
    const { valid, errors } = editor.validate();

    if (!valid) {
      setError(errors.join('\n'));
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const definition = editor.getDefinition();

      if (workflowId) {
        const response = await api.put(`/workflows/${workflowId}`, definition);
        if (response.error) {
          throw new Error(response.error.message);
        }
      } else {
        const response = await api.post('/workflows', definition);
        if (response.error) {
          throw new Error(response.error.message);
        }
        const newWorkflowId = (response.data as any)?.id;
        if (newWorkflowId) {
          setSuccess('Workflow created successfully');
          setTimeout(() => navigate(`/workflows/${newWorkflowId}`), 1500);
          return;
        }
      }

      setSuccess('Workflow saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save workflow';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddEdge = (source: string, target: string) => {
    editor.addEdge(source, target);
    setSuccess('Connection added');
    setTimeout(() => setSuccess(null), 2000);
  };

  return (
    <div className="h-screen flex flex-col bg-neon-bg text-neon-text">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b-2 border-neon-divider bg-neon-bg/95 backdrop-blur-glass">
        <div className="px-8 py-5 max-w-full">
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1">
              <button
                onClick={() => navigate(-1)}
                className="text-neon-text-secondary hover:text-neon-accent transition font-bold text-lg mb-2"
              >
                ← Back
              </button>
              <Input
                value={editor.name}
                onChange={e => editor.setName(e.target.value)}
                placeholder="Workflow name (required)"
                className="font-bold text-2xl bg-neon-surface border-neon-divider text-neon-text placeholder-neon-text-secondary"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => editor.undo()}
                disabled={!editor.canUndo}
                variant="secondary"
                size="sm"
              >
                ↶ Undo
              </Button>
              <Button
                onClick={() => editor.redo()}
                disabled={!editor.canRedo}
                variant="secondary"
                size="sm"
              >
                ↷ Redo
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                variant="primary"
              >
                {saving ? 'Saving...' : '✓ Save'}
              </Button>
            </div>
          </div>
          <Textarea
            value={editor.description}
            onChange={e => editor.setDescription(e.target.value)}
            placeholder="Workflow description (optional)"
            rows={2}
            className="mt-3 bg-neon-surface border-neon-divider text-neon-text placeholder-neon-text-secondary"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Panel - Add Steps */}
        <div className="w-64 bg-neon-surface/50 border-r border-neon-divider p-4 overflow-y-auto">
          <h3 className="font-bold text-neon-text mb-4 text-lg tracking-wide">ADD STEP</h3>
          <div className="space-y-2 mb-4">
            <Select
              value={selectedStepType}
              onChange={e => setSelectedStepType(e.target.value)}
              options={STEP_TYPES}
            />
            <Button onClick={addStep} variant="primary" className="w-full">
              + Add Step
            </Button>
          </div>

          {selectedNode && (
            <>
              <div className="my-4 border-t border-neon-divider" />
              <h3 className="font-bold text-neon-text mb-4 text-lg tracking-wide">CONFIGURE STEP</h3>
              <StepConfigPanel
                node={selectedNode}
                onUpdate={editor.updateNode}
                onDelete={editor.deleteNode}
              />
            </>
          )}
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 overflow-hidden border-r border-neon-divider bg-neon-bg">
          <WorkflowCanvas
            nodes={editor.nodes}
            edges={editor.edges}
            selectedNodeId={selectedNodeId}
            onNodeSelect={setSelectedNodeId}
            onNodeDelete={editor.deleteNode}
            onNodesChange={(nodes) => {
              nodes.forEach(n => {
                const existing = editor.nodes.find(e => e.id === n.id);
                if (existing && (existing.position !== n.position)) {
                  editor.updateNode(n.id, { position: n.position });
                }
              });
            }}
            onEdgesChange={() => {
              // Handle edge changes if needed
            }}
            onConnect={handleAddEdge}
          />
        </div>

        {/* Right Panel - Preview/Status */}
        <div className="w-64 bg-neon-surface/50 border-l border-neon-divider p-4 overflow-y-auto">
          <h3 className="font-bold text-neon-text mb-4 text-lg tracking-wide">WORKFLOW SUMMARY</h3>
          <div className="space-y-3 text-sm text-neon-text-secondary">
            <div className="p-3 rounded-lg bg-neon-primary/10 border border-neon-primary/30">
              <p className="text-neon-text-secondary text-xs font-bold mb-1">STEPS</p>
              <p className="text-2xl font-black text-neon-accent">{editor.nodes.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-neon-accent/10 border border-neon-accent/30">
              <p className="text-neon-text-secondary text-xs font-bold mb-1">CONNECTIONS</p>
              <p className="text-2xl font-black text-neon-accent">{editor.edges.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-neon-success/10 border border-neon-success/30">
              <p className="text-neon-text-secondary text-xs font-bold mb-1">ENTRY POINT</p>
              <p className="text-sm font-mono text-neon-success">{editor.entryPoint || '(none)'}</p>
            </div>
          </div>

          {selectedNode && (
            <>
              <div className="my-4 border-t border-neon-divider" />
              <h3 className="font-bold text-neon-text mb-3 text-lg tracking-wide">SELECTED STEP</h3>
              <div className="text-sm bg-neon-primary/10 p-3 rounded-lg border border-neon-primary/30">
                <p className="font-mono text-neon-accent text-xs mb-1">{selectedNode.id}</p>
                <p className="text-neon-text font-bold">{selectedNode.name}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="fixed bottom-4 right-4 max-w-sm space-y-2 z-50">
        {error && (
          <Alert
            type="error"
            title="Validation Error"
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            type="success"
            title="Success"
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        )}
      </div>
    </div>
  );
};

export const WorkflowEditorPage: React.FC = () => {
  const { workflowId } = useParams<{ workflowId: string }>();
  const { data: existingWorkflow, loading } = useWorkflow(workflowId || '');

  // For new workflows, render immediately; for edits, wait until data loads
  if (workflowId && loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  // Map API workflow to editor initial state format
  const parsedDefinition = typeof existingWorkflow?.definition === 'string'
    ? JSON.parse(existingWorkflow.definition)
    : existingWorkflow?.definition;

  const initialWorkflow = existingWorkflow
    ? {
        name: existingWorkflow.name,
        description: existingWorkflow.description || '',
        nodes: (parsedDefinition as any)?.nodes || [],
        edges: (parsedDefinition as any)?.edges || [],
        entryPoint: (parsedDefinition as any)?.entryPoint || '',
      }
    : undefined;

  return <WorkflowEditorContent workflowId={workflowId} initialWorkflow={initialWorkflow} />;
};
