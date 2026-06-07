import { useState, useEffect } from 'react';
import { MetricsCard } from '@components/MetricsCard';
import { TrendChart } from '@components/TrendChart';
import { Card } from '@components/Card';
import { Spinner } from '@components/Spinner';
import { analyticsApi, type AnalyticsMetrics, type TrendDataPoint } from '@services/analyticsApi';

export function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [trends, setTrends] = useState<TrendDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [metricsData, trendsData] = await Promise.all([
          analyticsApi.getMetrics(),
          analyticsApi.getTrends(),
        ]);
        setMetrics(metricsData);
        setTrends(trendsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <p className="text-red-800">Error loading analytics: {error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-2 text-gray-600">Monitor your automation performance and trends</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <MetricsCard
            title="Total Workflows"
            value={metrics.total_workflows}
            subtitle={`${metrics.active_workflows} active`}
            trend="up"
            color="blue"
          />
          <MetricsCard
            title="Total Executions"
            value={metrics.total_executions.toLocaleString()}
            subtitle={`${metrics.executions_today} today`}
            trend="up"
            color="green"
          />
          <MetricsCard
            title="Success Rate"
            value={`${metrics.success_rate}%`}
            subtitle={`${metrics.failed_today} failures today`}
            trend={metrics.success_rate >= 90 ? 'up' : 'down'}
            color={metrics.success_rate >= 90 ? 'green' : 'yellow'}
          />
          <MetricsCard
            title="Avg Duration"
            value={`${Math.round(metrics.average_duration_seconds)}s`}
            subtitle="per execution"
            trend="neutral"
            color="blue"
          />
        </div>

        {/* Trend Chart */}
        <Card className="mb-8 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Execution Trends (Last 7 Days)</h2>
          <TrendChart data={trends} />
        </Card>

        {/* Integration Status */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Integration Health</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(metrics.integrations).map(([name, info]) => (
              <div
                key={name}
                className={`rounded-lg border p-4 ${
                  info.status === 'healthy' ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'
                }`}
              >
                <p className="font-medium capitalize text-gray-900">{name}</p>
                <p className={`text-sm mt-1 ${info.status === 'healthy' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {info.status === 'healthy' ? '✓ Healthy' : '⚠ Degraded'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Last: {new Date(info.last_call).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
