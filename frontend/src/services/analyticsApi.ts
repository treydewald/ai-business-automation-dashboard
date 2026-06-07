export interface AnalyticsMetrics {
  total_workflows: number;
  active_workflows: number;
  total_executions: number;
  success_rate: number;
  average_duration_seconds: number;
  executions_today: number;
  failed_today: number;
  integrations: Record<string, { status: string; last_call: string }>;
}

export interface TrendDataPoint {
  date: string;
  executions: number;
  success_rate: number;
}

const API_BASE = 'http://localhost:8000/api';

export const analyticsApi = {
  async getMetrics(): Promise<AnalyticsMetrics> {
    const response = await fetch(`${API_BASE}/analytics`);
    if (!response.ok) throw new Error('Failed to fetch analytics');
    return response.json();
  },

  async getTrends(): Promise<TrendDataPoint[]> {
    try {
      const response = await fetch(`${API_BASE}/analytics/trends`);
      if (!response.ok) throw new Error('No trends endpoint');
      return response.json();
    } catch {
      // Return mock trend data if endpoint not available
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toISOString().split('T')[0],
          executions: Math.floor(Math.random() * 50) + 100,
          success_rate: Math.random() * 10 + 88,
        };
      });
    }
  },
};
