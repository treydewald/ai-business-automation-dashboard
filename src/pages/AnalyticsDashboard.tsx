/**
 * Analytics Dashboard page
 */
import React, { useEffect, useState } from "react";
import { MetricsCard } from "../components/MetricsCard";
import { TrendChart } from "../components/TrendChart";
import { analyticsApi, DashboardMetrics } from "../services/analyticsApi";

export const AnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(30);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsApi.getMetrics(dateRange);
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [dateRange]);

  const handleExport = async (format: "json" | "csv" | "pdf") => {
    try {
      await analyticsApi.exportAnalytics(format);
      alert(`Analytics exported as ${format.toUpperCase()}`);
    } catch (err) {
      alert("Failed to export analytics");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">
            Error: {error}
          </p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const shortDateLabels = metrics.trends.dates.map(
    (date) => new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Analytics Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Last updated: {new Date(metrics.timestamp).toLocaleString()}
            </p>
          </div>

          <div className="mt-4 sm:mt-0 flex gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last year</option>
            </select>

            <button
              onClick={() => handleExport("json")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
            >
              Export
            </button>
          </div>
        </div>

        {/* Metrics Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <MetricsCard
            title="Total Workflows"
            value={metrics.summary.total_workflows}
            icon={<div className="text-2xl">📊</div>}
          />
          <MetricsCard
            title="Executions Today"
            value={metrics.summary.executions_today}
            icon={<div className="text-2xl">⚡</div>}
          />
          <MetricsCard
            title="Success Rate"
            value={`${metrics.summary.success_rate}%`}
            icon={<div className="text-2xl">✓</div>}
          />
        </div>

        {/* Execution Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <TrendChart
            title="Execution Count Trend"
            data={metrics.trends.execution_counts}
            labels={shortDateLabels}
            color="blue"
          />
          <TrendChart
            title="Success Rate Trend"
            data={metrics.trends.success_rates}
            labels={shortDateLabels}
            color="green"
          />
        </div>

        {/* Top and Failing Workflows */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Workflows */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Top Workflows
            </h3>
            <div className="space-y-3">
              {metrics.top_workflows.length > 0 ? (
                metrics.top_workflows.map((wf, idx) => (
                  <div
                    key={wf.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 w-6">
                        #{idx + 1}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {wf.name}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {wf.execution_count} runs
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-600 dark:text-gray-400">No data available</p>
              )}
            </div>
          </div>

          {/* Failing Workflows */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Failing Workflows
            </h3>
            <div className="space-y-3">
              {metrics.failing_workflows.length > 0 ? (
                metrics.failing_workflows.map((wf, idx) => (
                  <div
                    key={wf.id}
                    className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 w-6">
                        #{idx + 1}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {wf.name}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                      {wf.failure_count} failures
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-600 dark:text-gray-400">No failures - great job!</p>
              )}
            </div>
          </div>
        </div>

        {/* Error Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Error Breakdown
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(metrics.error_breakdown).length > 0 ? (
              Object.entries(metrics.error_breakdown).map(([errorType, count]) => (
                <div
                  key={errorType}
                  className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded"
                >
                  <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {errorType}
                  </p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {count}
                  </p>
                </div>
              ))
            ) : (
              <p className="col-span-full text-gray-600 dark:text-gray-400">
                No errors recorded
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
