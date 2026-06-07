import React, { useState } from 'react';
import { Card } from './Card';
import { Input } from './Form/Input';
import { Select } from './Form/Select';
import { Button } from './Button';

interface Condition {
  field: string;
  operator: string;
  value: string;
  logic?: 'AND' | 'OR';
}

interface ConditionalBuilderProps {
  initialExpression?: string;
  availableFields: string[];
  onSave: (expression: string) => void;
  onCancel: () => void;
}

const OPERATORS = [
  { value: '===', label: 'Equals' },
  { value: '!==', label: 'Not Equals' },
  { value: '>', label: 'Greater Than' },
  { value: '<', label: 'Less Than' },
  { value: '>=', label: 'Greater or Equal' },
  { value: '<=', label: 'Less or Equal' },
  { value: 'contains', label: 'Contains' },
  { value: 'startsWith', label: 'Starts With' },
  { value: 'endsWith', label: 'Ends With' },
];

export const ConditionalBuilder: React.FC<ConditionalBuilderProps> = ({
  initialExpression,
  availableFields,
  onSave,
  onCancel,
}) => {
  const [conditions, setConditions] = useState<Condition[]>(
    initialExpression
      ? [{
          field: availableFields[0] || '',
          operator: '===',
          value: '',
          logic: 'AND',
        }]
      : [
          {
            field: availableFields[0] || '',
            operator: '===',
            value: '',
            logic: 'AND',
          },
        ]
  );

  const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');
  const [codeExpression, setCodeExpression] = useState(initialExpression || '');

  const addCondition = () => {
    setConditions([
      ...conditions,
      {
        field: availableFields[0] || '',
        operator: '===',
        value: '',
        logic: 'AND',
      },
    ]);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, field: string, value: unknown) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };
    setConditions(updated);
  };

  const buildExpression = (): string => {
    if (viewMode === 'code') {
      return codeExpression;
    }

    return conditions
      .map((condition, index) => {
        const { field, operator, value } = condition;
        let expr = '';

        if (operator === 'contains') {
          expr = `${field}.includes('${value}')`;
        } else if (operator === 'startsWith') {
          expr = `${field}.startsWith('${value}')`;
        } else if (operator === 'endsWith') {
          expr = `${field}.endsWith('${value}')`;
        } else {
          expr = `${field} ${operator} '${value}'`;
        }

        if (index > 0) {
          const logic = conditions[index - 1]?.logic || 'AND';
          return `${logic === 'AND' ? '&&' : '||'} ${expr}`;
        }

        return expr;
      })
      .join(' ');
  };

  const handleSave = () => {
    const expression = buildExpression();
    onSave(expression);
  };

  return (
    <Card className="p-4 space-y-4 max-h-96 overflow-y-auto">
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode('visual')}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            viewMode === 'visual'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Visual
        </button>
        <button
          onClick={() => setViewMode('code')}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            viewMode === 'code'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Code
        </button>
      </div>

      {viewMode === 'visual' ? (
        <div className="space-y-3">
          {conditions.map((condition, index) => (
            <div key={index} className="space-y-2 p-3 bg-gray-50 rounded border border-gray-200">
              {index > 0 && (
                <div className="flex items-center gap-2">
                  <Select
                    value={condition.logic || 'AND'}
                    onChange={e => updateCondition(index, 'logic', e.target.value)}
                    options={[
                      { value: 'AND', label: 'AND' },
                      { value: 'OR', label: 'OR' },
                    ]}
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <Select
                  value={condition.field}
                  onChange={e => updateCondition(index, 'field', e.target.value)}
                  options={availableFields.map(f => ({ value: f, label: f }))}
                />

                <Select
                  value={condition.operator}
                  onChange={e => updateCondition(index, 'operator', e.target.value)}
                  options={OPERATORS}
                />

                <Input
                  value={condition.value}
                  onChange={e => updateCondition(index, 'value', e.target.value)}
                  placeholder="Value"
                />

                {conditions.length > 1 && (
                  <button
                    onClick={() => removeCondition(index)}
                    className="text-red-600 hover:text-red-800 font-bold text-xl"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}

          <Button onClick={addCondition} variant="secondary" size="sm">
            + Add Condition
          </Button>
        </div>
      ) : (
        <textarea
          value={codeExpression}
          onChange={e => setCodeExpression(e.target.value)}
          className="w-full h-32 p-2 border rounded font-mono text-sm"
          placeholder="e.g., status === 'success' && count > 5"
        />
      )}

      <div className="flex gap-2 pt-4 border-t">
        <Button onClick={handleSave} variant="primary" size="sm">
          Save Condition
        </Button>
        <Button onClick={onCancel} variant="secondary" size="sm">
          Cancel
        </Button>
      </div>
    </Card>
  );
};
