import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@components/Button';
import { Input } from '@components/Form/Input';
import { Select } from '@components/Form/Select';
import { Card } from '@components/Card';
import { TemplateCard } from '@components/TemplateCard';
import { Spinner } from '@components/Spinner';
import { EmptyState } from '@components/EmptyState';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  author_name: string;
  version: number;
  usage_count: number;
  rating: number;
  review_count: number;
}

export function TemplateLibrary() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);

  const limit = 20;
  const categories = [
    'Data Processing',
    'Integration',
    'Notification',
    'Scheduling',
    'Monitoring',
    'Other'
  ];

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: limit.toString(),
        public_only: 'true',
      });

      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);

      const response = await fetch(`/api/templates?${params}`);
      if (!response.ok) throw new Error('Failed to fetch templates');

      const data = await response.json();
      setTemplates(data.templates);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [skip, search, categoryFilter]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleImportTemplate = useCallback(async (templateId: string, _templateName: string) => {
    try {
      const response = await fetch(`/api/templates/${templateId}/import`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to import template');

      const imported = await response.json();

      // Create a new workflow from the template
      const workflowResponse = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${imported.name} (Copy)`,
          description: imported.definition?.description,
          definition: imported.definition,
        }),
      });

      if (!workflowResponse.ok) throw new Error('Failed to create workflow from template');

      const newWorkflow = await workflowResponse.json();
      navigate(`/workflows/${newWorkflow.id}`);
    } catch (err) {
      alert(`Error importing template: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [navigate]);

  const handleNextPage = useCallback(() => {
    setSkip(skip + limit);
  }, [skip]);

  const handlePrevPage = useCallback(() => {
    setSkip(Math.max(0, skip - limit));
  }, [skip]);

  if (loading && templates.length === 0) {
    return <Spinner />;
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Template Library</h1>
        <p className="text-gray-600">Browse and import pre-built workflow templates</p>
      </div>

      <Card className="mb-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSkip(0);
            }}
          />

          <Select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setSkip(0);
            }}
            options={[
              { value: '', label: 'All Categories' },
              ...categories.map((cat) => ({ value: cat, label: cat }))
            ]}
          />

          <Button onClick={fetchTemplates} variant="secondary">
            Refresh
          </Button>
        </div>
      </Card>

      {error && (
        <Card className="mb-6 p-6 bg-red-50 border-red-200">
          <p className="text-red-800">Error: {error}</p>
        </Card>
      )}

      {templates.length === 0 ? (
        <EmptyState
          title="No templates found"
          description="Try adjusting your search filters"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onImport={() => handleImportTemplate(template.id, template.name)}
              />
            ))}
          </div>

          <div className="flex items-center justify-between mt-8">
            <p className="text-gray-600">
              Showing {skip + 1}-{Math.min(skip + limit, total)} of {total} templates
            </p>
            <div className="flex gap-4">
              <Button
                onClick={handlePrevPage}
                disabled={skip === 0}
                variant="secondary"
              >
                Previous
              </Button>
              <Button
                onClick={handleNextPage}
                disabled={skip + limit >= total}
                variant="secondary"
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
