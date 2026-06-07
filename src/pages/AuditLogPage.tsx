/**
 * Audit Log Page for viewing and searching audit logs
 */
import React, { useEffect, useState } from "react";

interface AuditLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  timestamp: string;
  tenant_id: string | null;
  changes: Record<string, unknown>;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    user_id: "",
    action: "",
    resource_type: "",
    limit: 100,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState("action");

  const token = localStorage.getItem("authToken");

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filter.user_id) params.append("user_id", filter.user_id);
      if (filter.action) params.append("action", filter.action);
      if (filter.resource_type) params.append("resource_type", filter.resource_type);
      params.append("limit", filter.limit.toString());

      const response = await fetch(`${API_BASE_URL}/api/audit-logs/?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch audit logs");

      const data = await response.json();
      setLogs(data.logs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/api/audit-logs/search?query=${encodeURIComponent(searchQuery)}&field=${searchField}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      setLogs(data.logs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [filter]);

  const handleExport = async (format: "json" | "csv") => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/audit-logs/export?format=${format}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Export failed");

      const data = await response.json();
      const element = document.createElement("a");

      if (format === "json") {
        element.setAttribute(
          "href",
          `data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify(data.data, null, 2))}`
        );
        element.setAttribute("download", `audit-logs-${new Date().toISOString()}.json`);
      } else {
        element.setAttribute(
          "href",
          `data:text/csv;charset=utf-8,${encodeURIComponent(data.data)}`
        );
        element.setAttribute("download", `audit-logs-${new Date().toISOString()}.csv`);
      }

      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err) {
      alert("Export failed");
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Audit Logs
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Search Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Search & Filter
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Query
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter search query..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Field
              </label>
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="action">Action</option>
                <option value="user_id">User ID</option>
                <option value="resource_type">Resource Type</option>
                <option value="resource_id">Resource ID</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                User ID
              </label>
              <input
                type="text"
                value={filter.user_id}
                onChange={(e) => setFilter({ ...filter, user_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Filter by user..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Action
              </label>
              <input
                type="text"
                value={filter.action}
                onChange={(e) => setFilter({ ...filter, action: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Filter by action..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Resource Type
              </label>
              <input
                type="text"
                value={filter.resource_type}
                onChange={(e) =>
                  setFilter({ ...filter, resource_type: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Filter by resource..."
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Search
            </button>

            <button
              onClick={() => handleExport("json")}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
            >
              Export JSON
            </button>

            <button
              onClick={() => handleExport("csv")}
              className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  User
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Resource
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {log.user_id || "system"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded text-xs font-medium">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {log.resource_type}
                      {log.resource_id && ` (${log.resource_id})`}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No audit logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
          Showing {logs.length} log entries
        </div>
      </div>
    </div>
  );
};
