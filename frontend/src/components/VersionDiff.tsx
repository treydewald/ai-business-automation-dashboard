interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
}

interface VersionDiffProps {
  fromVersion?: string;
  toVersion?: string;
  fromLabel?: string;
  toLabel?: string;
  diff?: DiffLine[];
}

function computeDiff(fromJson: string, toJson: string): DiffLine[] {
  const fromLines = fromJson.split('\n');
  const toLines = toJson.split('\n');
  const result: DiffLine[] = [];

  const maxLen = Math.max(fromLines.length, toLines.length);
  for (let i = 0; i < maxLen; i++) {
    if (i >= fromLines.length) {
      result.push({ type: 'added', content: toLines[i] });
    } else if (i >= toLines.length) {
      result.push({ type: 'removed', content: fromLines[i] });
    } else if (fromLines[i] !== toLines[i]) {
      result.push({ type: 'removed', content: fromLines[i] });
      result.push({ type: 'added', content: toLines[i] });
    } else {
      result.push({ type: 'unchanged', content: fromLines[i] });
    }
  }
  return result;
}

export function VersionDiff({ fromLabel = 'Previous', toLabel = 'Current', diff, fromVersion, toVersion }: VersionDiffProps) {
  const lines: DiffLine[] = diff || (fromVersion && toVersion
    ? computeDiff(
        JSON.stringify(JSON.parse(fromVersion), null, 2),
        JSON.stringify(JSON.parse(toVersion), null, 2)
      )
    : []);

  const addedCount = lines.filter((l) => l.type === 'added').length;
  const removedCount = lines.filter((l) => l.type === 'removed').length;

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between bg-gray-100 px-4 py-2 border-b border-gray-200">
        <div className="flex gap-4 text-sm">
          <span className="font-medium text-gray-700">{fromLabel}</span>
          <span className="text-gray-400">→</span>
          <span className="font-medium text-gray-700">{toLabel}</span>
        </div>
        <div className="flex gap-3 text-xs">
          <span className="text-green-600">+{addedCount}</span>
          <span className="text-red-600">-{removedCount}</span>
        </div>
      </div>
      <div className="font-mono text-xs overflow-auto max-h-96">
        {lines.map((line, i) => (
          <div
            key={i}
            className={
              line.type === 'added'
                ? 'bg-green-50 text-green-800 px-4 py-0.5'
                : line.type === 'removed'
                ? 'bg-red-50 text-red-800 px-4 py-0.5'
                : 'bg-white text-gray-700 px-4 py-0.5'
            }
          >
            <span className="select-none mr-2 text-gray-400 w-4 inline-block">
              {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
            </span>
            {line.content}
          </div>
        ))}
        {lines.length === 0 && (
          <div className="px-4 py-6 text-center text-gray-400">No differences found</div>
        )}
      </div>
    </div>
  );
}
