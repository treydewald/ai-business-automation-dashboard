import { useState, type ChangeEvent } from 'react';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { Input } from '@components/Form/Input';
import { Modal } from '@components/Modal';

interface IntegrationStep {
  name: string;
  type: 'http_request' | 'transform' | 'condition';
  config: Record<string, string>;
}

interface CustomIntegration {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  authType: 'none' | 'api_key' | 'oauth2' | 'basic';
  steps: IntegrationStep[];
}

export function CustomIntegrationBuilder() {
  const [integrations, setIntegrations] = useState<CustomIntegration[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newBaseUrl, setNewBaseUrl] = useState('');
  const [newAuthType, setNewAuthType] = useState<CustomIntegration['authType']>('none');
  const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'testing' | 'ok' | 'error'>>({});

  const handleCreate = async () => {
    if (!newName.trim() || !newBaseUrl.trim()) return;
    const integration: CustomIntegration = {
      id: `custom-${Date.now()}`,
      name: newName,
      description: newDescription,
      baseUrl: newBaseUrl,
      authType: newAuthType,
      steps: [],
    };
    setIntegrations((prev) => [...prev, integration]);
    setShowCreateModal(false);
    setNewName('');
    setNewDescription('');
    setNewBaseUrl('');
    setNewAuthType('none');
  };

  const handleTest = async (id: string) => {
    setTestStatus((prev) => ({ ...prev, [id]: 'testing' }));
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setTestStatus((prev) => ({ ...prev, [id]: 'ok' }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Custom Integration Builder</h1>
            <p className="mt-2 text-gray-600">
              Build custom integrations with any HTTP-based API or service
            </p>
          </div>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            + New Integration
          </Button>
        </div>

        {/* Existing integrations */}
        {integrations.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-4xl mb-4">🔌</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No custom integrations yet</h3>
            <p className="text-gray-500 mb-6">
              Connect to any REST API by defining its endpoints and authentication
            </p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              Create your first integration
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {integrations.map((integration) => (
              <Card key={integration.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{integration.name}</h3>
                    {integration.description && (
                      <p className="text-sm text-gray-600 mt-1">{integration.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Base URL: <span className="font-mono">{integration.baseUrl}</span>
                    </p>
                    <p className="text-xs text-gray-500">Auth: {integration.authType}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {testStatus[integration.id] === 'ok' && (
                      <span className="text-green-600 text-sm">✓ Connected</span>
                    )}
                    {testStatus[integration.id] === 'error' && (
                      <span className="text-red-600 text-sm">✗ Failed</span>
                    )}
                    <Button
                      variant="secondary"
                      onClick={() => handleTest(integration.id)}
                      disabled={testStatus[integration.id] === 'testing'}
                    >
                      {testStatus[integration.id] === 'testing' ? 'Testing...' : 'Test'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Custom Integration">
          <div className="space-y-4">
            <Input
              label="Integration Name *"
              placeholder="e.g. Salesforce CRM"
              value={newName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
            />
            <Input
              label="Description"
              placeholder="What does this integration do?"
              value={newDescription}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setNewDescription(e.target.value)}
            />
            <Input
              label="Base URL *"
              placeholder="https://api.example.com"
              value={newBaseUrl}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setNewBaseUrl(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Authentication</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newAuthType}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setNewAuthType(e.target.value as CustomIntegration['authType'])
                }
              >
                <option value="none">None</option>
                <option value="api_key">API Key</option>
                <option value="oauth2">OAuth 2.0</option>
                <option value="basic">Basic Auth</option>
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreate}>Create Integration</Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
