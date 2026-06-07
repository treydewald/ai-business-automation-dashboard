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

  const editor = useWorkflowEditor(initialWorkflow);

  // Initialize demo workflow on first load (if no initial workflow provided)
  React.useEffect(() => {
    if (!initialWorkflow && !workflowId && editor.nodes.length === 0) {
      // Set demo workflow name and description
      editor.setName('Lead Qualification Pipeline');
      editor.setDescription('Automatically qualifies incoming leads and routes them to appropriate sales teams based on fit score and budget.');

      // Add demo steps
      const step1: WorkflowNode = {
        id: 'step-1',
        name: 'Receive Lead',
        type: 'webhook',
        parameters: { method: 'POST', path: '/webhooks/leads' },
        position: { x: 50, y: 150 },
      };

      const step2: WorkflowNode = {
        id: 'step-2',
        name: 'Validate Lead Data',
        type: 'action',
        parameters: { validation: 'email,phone' },
        position: { x: 250, y: 150 },
      };

      const step3: WorkflowNode = {
        id: 'step-3',
        name: 'Score Lead Quality',
        type: 'action',
        parameters: { scoringModel: 'ml-v2' },
        position: { x: 450, y: 150 },
      };

      const step4: WorkflowNode = {
        id: 'step-4',
        name: 'Route by Score',
        type: 'condition',
        parameters: { operator: 'gt', threshold: 75 },
        position: { x: 650, y: 150 },
      };

      const step5: WorkflowNode = {
        id: 'step-5',
        name: 'Notify Sales Team',
        type: 'slack',
        parameters: { channel: '#sales-leads', message: 'New qualified lead' },
        position: { x: 850, y: 100 },
      };

      const step6: WorkflowNode = {
        id: 'step-6',
        name: 'Add to Drip Campaign',
        type: 'email',
        parameters: { campaign: 'welcome-series' },
        position: { x: 850, y: 250 },
      };

      // Add nodes
      editor.addNode(step1);
      editor.addNode(step2);
      editor.addNode(step3);
      editor.addNode(step4);
      editor.addNode(step5);
      editor.addNode(step6);

      // Add connections
      editor.addEdge('step-1', 'step-2');
      editor.addEdge('step-2', 'step-3');
      editor.addEdge('step-3', 'step-4');
      editor.addEdge('step-4', 'step-5');
      editor.addEdge('step-4', 'step-6');

      setSuccess('Demo workflow loaded! Explore the builder to modify steps and connections.');
      setTimeout(() => setSuccess(null), 5000);
    }
  }, []);

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
