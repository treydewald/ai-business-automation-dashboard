import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflows } from '../hooks/useWorkflows';
import WorkflowList from '../components/WorkflowList';
import Button from '../components/Button';
import Input from '../components/Form/Input';
import Select from '../components/Form/Select';
import Card from '../components/Card';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';

const WorkflowDashboard = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('created');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDesc, setNewWorkflowDesc] = useState('');

  const { data: workflows, loading, error, refetch } = useWorkflows({
    search,
    status: statusFilter || undefined,
    sortBy,
    page: currentPage,
  });

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setCurrentPage(1);
  }, []);

  const handleStatusFilter = useCallback((value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback((value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  }, []);

  const handleCreateWorkflow = useCallback(async () => {
    if (!newWorkflowName.trim()) {
      alert('Workflow name is required');
      return;
    }

    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWorkflowName,
          description: newWorkflowDesc,
          definition: { steps: [] },
        }),
      });

      if (!response.ok) throw new Error('Failed to create workflow');

      const newWorkflow = await response.json();
      setShowCreateModal(false);
      setNewWorkflowName('');
      setNewWorkflowDesc('');
      refetch();
      navigate(`/workflows/${newWorkflow.id}`);
    } catch (err) {
      alert(`Error creating workflow: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [newWorkflowName, newWorkflowDesc, refetch, navigate]);

  const workflowsData = useMemo(() => {
    if (!workflows) return [];
    return workflows.items || [];
  }, [workflows]);

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <p className="text-red-800">Error loading workflows: {error}</p>
          <Button variant="primary" onClick={refetch} className="mt-4">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Workflows</h1>
            <p className="mt-2 text-gray-600">Manage and monitor your automation workflows</p>
          </div>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            + Create Workflow
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input
              placeholder="Search workflows..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <Select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'completed', label: 'Completed' },
                { value: 'failed', label: 'Failed' },
              ]}
            />
            <Select
              value={sortBy}
              onChange={(e) => handleSort(e.target.value)}
              options={[
                { value: 'created', label: 'Created Date' },
                { value: 'name', label: 'Name' },
                { value: 'last_execution', label: 'Last Execution' },
              ]}
            />
          </div>
        </Card>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : workflowsData.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-600">No workflows found</p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)} className="mt-4">
              Create your first workflow
            </Button>
          </Card>
        ) : (
          <>
            <WorkflowList
              workflows={workflowsData}
              onWorkflowClick={(id) => navigate(`/workflows/${id}`)}
            />

            {/* Pagination */}
            {workflows && workflows.total_pages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                {Array.from({ length: workflows.total_pages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'primary' : 'secondary'}
                    onClick={() => setCurrentPage(page)}
                    className="min-w-10"
                  >
                    {page}
                  </Button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Create Modal */}
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Workflow">
          <div className="space-y-4">
            <Input
              label="Workflow Name *"
              placeholder="Enter workflow name"
              value={newWorkflowName}
              onChange={(e) => setNewWorkflowName(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                placeholder="Enter workflow description"
                rows={4}
                value={newWorkflowDesc}
                onChange={(e) => setNewWorkflowDesc(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreateWorkflow}>
                Create
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default WorkflowDashboard;
