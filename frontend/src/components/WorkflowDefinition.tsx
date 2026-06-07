interface WorkflowDefinitionProps {
  definition: string | Record<string, unknown>;
}

export function WorkflowDefinition({ definition }: WorkflowDefinitionProps) {
  const definitionObj = typeof definition === 'string' ? JSON.parse(definition) : definition;

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
        <pre className="text-sm text-gray-100 font-mono whitespace-pre-wrap break-words">
          {JSON.stringify(definitionObj, null, 2)}
        </pre>
      </div>
    </div>
  );
}
