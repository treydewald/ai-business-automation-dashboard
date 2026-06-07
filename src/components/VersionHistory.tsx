import React, { useState, useEffect } from "react";
import { Button } from "./Button";
import { Spinner } from "./Spinner";

interface Version {
  id: string;
  workflow_id: string;
  version_number: number;
  author?: string;
  changelog?: string;
  created_at: string;
}

interface VersionHistoryProps {
  workflowId: string;
  onSelectVersion: (versionNumber: number) => void;
  onRollback: (versionNumber: number) => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  workflowId,
  onSelectVersion,
  onRollback,
}) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVersionHistory();
  }, [workflowId]);

  const fetchVersionHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/workflows/${workflowId}/versions?limit=50`
      );
      if (!response.ok) throw new Error("Failed to fetch versions");
      const data = await response.json();
      setVersions(data.versions);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) return <Spinner />;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Version History</h3>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded mb-4">{error}</div>
      )}

      {versions.length === 0 ? (
        <p className="text-gray-500">No versions available</p>
      ) : (
        <div className="space-y-2">
          {versions.map((version) => (
            <div
              key={version.id}
              className="border rounded p-4 hover:bg-gray-50 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">
                    Version {version.version_number}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatDate(version.created_at)}
                  </p>
                  {version.author && (
                    <p className="text-sm text-gray-600">by {version.author}</p>
                  )}
                  {version.changelog && (
                    <p className="text-sm text-gray-700 mt-2">
                      {version.changelog}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onSelectVersion(version.version_number)}
                  >
                    View
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onRollback(version.version_number)}
                  >
                    Rollback
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
