import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useWorkflow } from '@hooks/useWorkflow';
import { WorkflowMetadata } from '@components/WorkflowMetadata';
import { WorkflowDefinition } from '@components/WorkflowDefinition';
import { ExecutionList } from '@components/ExecutionList';
import { Button } from '@components/Button';
import { Card } from '@components/Card';
import { Spinner } from '@components/Spinner';
import { Modal } from '@components/Modal';

export function WorkflowDetailsPage() {
  const { workflowId = '' } = useParams<{ workflowId: string }>();
  const navigate = useNavigate();
  const { data: workflow, loading, error, refetch } = useWorkflow(workflowId);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  if (!workflowId) {
    return (
      <div className="p-6">
        <Card className="text-center py-12">
          <p className="text-red-600">Invalid workflow ID</p>
          <Button variant="primary" onClick={() => navigate('/workflows')} className="mt-4">
            Back to Workflows
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <p className="text-red-800">
            {error ? `Error loading workflow: ${error}` : 'Workflow not found'}
          </p>
          <Button variant="primary" onClick={() => navigate('/workflows')} className="mt-4">
            Back to Workflows
          </Button>
        </Card>
      </div>
    );
  }

  const handleRunWorkflow = async () => {
    setIsRunning(true);
    try {
      const response = await fetch(`/api/workflows/${workflowId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to run workflow');

      const result = await response.json();
      alert(`Workflow started with execution ID: ${result.execution_id || result.id}`);
      refetch();
    } catch (err) {
      alert(`Error running workflow: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleDeleteWorkflow = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete workflow');

      alert('Workflow deleted successfully');
      navigate('/workflows');
    } catch (err) {
      alert(`Error deleting workflow: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/workflows')} className="mb-4">
            ← Back to Workflows
          </Button>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate(`/workflows/${workflowId}/edit`)}
            >
              Edit
            </Button>
            <Button
              variant="primary"
              onClick={handleRunWorkflow}
              disabled={isRunning}
            >
              {isRunning ? 'Running...' : 'Run Workflow'}
            </Button>
            <Button
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Metadata */}
        <WorkflowMetadata workflow={workflow} />

        {/* Workflow Definition */}
        <Card className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Workflow Definition</h2>
          <WorkflowDefinition definition={workflow.definition} />
        </Card>

        {/* Recent Executions */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Executions</h2>
          <ExecutionList workflowId={workflowId} />
        </Card>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Delete Workflow"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete this workflow? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteWorkflow}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
