import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WorkflowCanvas } from '../components/WorkflowCanvas';
import { StepConfigPanel } from '../components/StepConfigPanel';
import { Button } from '../components/Button';
import { Input } from '../components/Form/Input';
import { Textarea } from '../components/Form/Textarea';
import { Select } from '../components/Form/Select';
import { Alert } from '../components/Alert';
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

export const WorkflowEditorPage: React.FC = () => {
  const { workflowId } = useParams<{ workflowId: string }>();
  const navigate = useNavigate();
  const [selectedStepType, setSelectedStepType] = useState('action');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: existingWorkflow } = useWorkflow(workflowId || '');

  const editor = useWorkflowEditor(existingWorkflow as any);

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
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <Input
                value={editor.name}
                onChange={e => editor.setName(e.target.value)}
                placeholder="Workflow name (required)"
                className="font-semibold"
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
                {saving ? 'Saving...' : 'Save Workflow'}
              </Button>
              <Button onClick={() => navigate(-1)} variant="secondary">
                Cancel
              </Button>
            </div>
          </div>
          <Textarea
            value={editor.description}
            onChange={e => editor.setDescription(e.target.value)}
            placeholder="Workflow description (optional)"
            rows={2}
            className="mt-2"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Panel - Add Steps */}
        <div className="w-64 bg-white shadow-sm border-r p-4 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 mb-3">Add Step</h3>
          <div className="space-y-2 mb-3">
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
              <hr className="my-4" />
              <h3 className="font-semibold text-gray-900 mb-3">Configure Step</h3>
              <StepConfigPanel
                node={selectedNode}
                onUpdate={editor.updateNode}
                onDelete={editor.deleteNode}
              />
            </>
          )}
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 overflow-hidden border-r bg-gray-100">
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
        <div className="w-64 bg-white shadow-sm border-l p-4 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 mb-3">Workflow Summary</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>Steps:</strong> {editor.nodes.length}
            </p>
            <p>
              <strong>Connections:</strong> {editor.edges.length}
            </p>
            <p>
              <strong>Entry Point:</strong> {editor.entryPoint || '(none)'}
            </p>
          </div>

          {selectedNode && (
            <>
              <hr className="my-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Selected Step</h3>
              <div className="text-sm bg-blue-50 p-2 rounded border border-blue-200">
                <p className="font-mono text-blue-900">{selectedNode.id}</p>
                <p className="text-blue-700">{selectedNode.name}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="fixed bottom-4 right-4 max-w-sm space-y-2">
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
