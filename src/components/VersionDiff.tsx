import React, { useState, useEffect } from "react";
import { Spinner } from "./Spinner";

interface Change {
  added?: Record<string, any>[];
  removed?: Record<string, any>[];
  modified?: Array<{ key: string; old: any; new: any }>;
}

interface VersionDiffProps {
  workflowId: string;
  version1: number;
  version2: number;
}

export const VersionDiff: React.FC<VersionDiffProps> = ({
  workflowId,
  version1,
  version2,
}) => {
  const [diff, setDiff] = useState<Change | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDiff();
  }, [workflowId, version1, version2]);

  const fetchDiff = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/workflows/${workflowId}/versions/compare?version1=${version1}&version2=${version2}`
      );
      if (!response.ok) throw new Error("Failed to fetch diff");
      const data = await response.json();
      setDiff(data.changes);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner />;

  if (!diff) return <div className="text-gray-500">No differences</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">
        Diff: Version {version1} → Version {version2}
      </h3>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded mb-4">{error}</div>
      )}

      <div className="space-y-6">
        {diff.added && diff.added.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-green-700 mb-2">
              Added ({diff.added.length})
            </h4>
            <div className="bg-green-50 rounded p-3 border border-green-200">
              <pre className="text-xs text-green-800 overflow-auto">
                {JSON.stringify(diff.added, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {diff.removed && diff.removed.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-red-700 mb-2">
              Removed ({diff.removed.length})
            </h4>
            <div className="bg-red-50 rounded p-3 border border-red-200">
              <pre className="text-xs text-red-800 overflow-auto">
                {JSON.stringify(diff.removed, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {diff.modified && diff.modified.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-blue-700 mb-2">
              Modified ({diff.modified.length})
            </h4>
            <div className="space-y-2">
              {diff.modified.map((change, index) => (
                <div
                  key={index}
                  className="bg-blue-50 rounded p-3 border border-blue-200"
                >
                  <p className="font-mono text-xs font-semibold text-blue-900">
                    {change.key}
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <p className="text-xs text-gray-600">Before:</p>
                      <pre className="text-xs bg-red-50 p-2 rounded text-red-800 overflow-auto">
                        {JSON.stringify(change.old, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">After:</p>
                      <pre className="text-xs bg-green-50 p-2 rounded text-green-800 overflow-auto">
                        {JSON.stringify(change.new, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(!diff.added || diff.added.length === 0) &&
          (!diff.removed || diff.removed.length === 0) &&
          (!diff.modified || diff.modified.length === 0) && (
            <p className="text-gray-500">No differences between versions</p>
          )}
      </div>
    </div>
  );
};
