import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { Input } from './Form/Input';
import { Select } from './Form/Select';
import { Textarea } from './Form/Textarea';
import { Button } from './Button';
import type { WorkflowNode } from '../utils/dagValidation';

interface StepConfigPanelProps {
  node: WorkflowNode | null;
  onUpdate: (nodeId: string, updates: Partial<WorkflowNode>) => void;
  onDelete: (nodeId: string) => void;
}

const STEP_TYPES = [
  { value: 'action', label: 'Action' },
  { value: 'webhook', label: 'Webhook' },
  { value: 'email', label: 'Email' },
  { value: 'slack', label: 'Slack' },
  { value: 'condition', label: 'Condition' },
  { value: 'loop', label: 'Loop' },
  { value: 'parallel', label: 'Parallel' },
];

export const StepConfigPanel: React.FC<StepConfigPanelProps> = ({
  node,
  onUpdate,
  onDelete,
}) => {
  const [formData, setFormData] = useState<Partial<WorkflowNode>>({});

  useEffect(() => {
    if (node) {
      setFormData({ ...node });
    }
  }, [node]);

  if (!node) {
    return (
      <Card className="p-4">
        <p className="text-gray-500 text-center">Select a step to configure</p>
      </Card>
    );
  }

  const handleChange = (
    field: string,
    value: unknown
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    onUpdate(node.id, formData);
  };

  const handleParameterChange = (key: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [key]: value,
      },
    }));
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Step Name
          </label>
          <Input
            value={formData.name || ''}
            onChange={e => handleChange('name', e.target.value)}
            placeholder="Enter step name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Step Type
          </label>
          <Select
            value={formData.type || 'action'}
            onChange={e => handleChange('type', e.target.value)}
            options={STEP_TYPES}
          />
        </div>

        {formData.type === 'condition' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condition Expression
            </label>
            <Textarea
              value={(formData.parameters?.condition as string) || ''}
              onChange={e =>
                handleParameterChange('condition', e.target.value)
              }
              placeholder="e.g., status === 'success'"
              rows={3}
            />
          </div>
        )}

        {formData.type === 'webhook' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL
              </label>
              <Input
                value={(formData.parameters?.url as string) || ''}
                onChange={e => handleParameterChange('url', e.target.value)}
                placeholder="https://..."
                type="url"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Method
              </label>
              <Select
                value={(formData.parameters?.method as string) || 'POST'}
                onChange={e => handleParameterChange('method', e.target.value)}
                options={[
                  { value: 'GET', label: 'GET' },
                  { value: 'POST', label: 'POST' },
                  { value: 'PUT', label: 'PUT' },
                  { value: 'DELETE', label: 'DELETE' },
                ]}
              />
            </div>
          </>
        )}

        {formData.type === 'email' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To
              </label>
              <Input
                value={(formData.parameters?.to as string) || ''}
                onChange={e => handleParameterChange('to', e.target.value)}
                placeholder="recipient@example.com"
                type="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <Input
                value={(formData.parameters?.subject as string) || ''}
                onChange={e => handleParameterChange('subject', e.target.value)}
                placeholder="Email subject"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Body
              </label>
              <Textarea
                value={(formData.parameters?.body as string) || ''}
                onChange={e => handleParameterChange('body', e.target.value)}
                placeholder="Email body"
                rows={4}
              />
            </div>
          </>
        )}

        {formData.type === 'slack' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <Textarea
              value={(formData.parameters?.message as string) || ''}
              onChange={e => handleParameterChange('message', e.target.value)}
              placeholder="Slack message"
              rows={3}
            />
          </div>
        )}

        {formData.type === 'loop' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Variable
              </label>
              <Input
                value={(formData.parameters?.variable as string) || ''}
                onChange={e => handleParameterChange('variable', e.target.value)}
                placeholder="Variable name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Iterations
              </label>
              <Input
                type="number"
                value={String((formData.parameters?.maxIterations as number) || 10)}
                onChange={e =>
                  handleParameterChange('maxIterations', parseInt(e.target.value))
                }
                min="1"
              />
            </div>
          </>
        )}
      </div>

      <div className="flex gap-2 pt-4 border-t">
        <Button onClick={handleSave} variant="primary">
          Save Changes
        </Button>
        <Button
          onClick={() => onDelete(node.id)}
          variant="danger"
        >
          Delete Step
        </Button>
      </div>
    </Card>
  );
};
