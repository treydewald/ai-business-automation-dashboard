/**
 * Analytics API service
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface MetricsSummary {
  total_workflows: number;
  executions_today: number;
  success_rate: number;
}

export interface TrendData {
  dates: string[];
  execution_counts: number[];
  success_rates: number[];
  avg_durations: number[];
}

export interface TopWorkflow {
  id: string;
  name: string;
  execution_count: number;
}

export interface FailingWorkflow {
  id: string;
  name: string;
  failure_count: number;
}

export interface DashboardMetrics {
  timestamp: string;
  summary: MetricsSummary;
  trends: TrendData;
  top_workflows: TopWorkflow[];
  failing_workflows: FailingWorkflow[];
  integration_health: Record<string, unknown>;
  error_breakdown: Record<string, number>;
}

class AnalyticsApi {
  async getMetrics(dateRangeDays: number = 30): Promise<DashboardMetrics> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/analytics/metrics?date_range_days=${dateRangeDays}`
      );
      if (!response.ok) throw new Error("Failed to fetch metrics");
      return await response.json();
    } catch (error) {
      console.error("Error fetching metrics:", error);
      return this.getMockMetrics();
    }
  }

  async getSummary(): Promise<MetricsSummary> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics/summary`);
      if (!response.ok) throw new Error("Failed to fetch summary");
      return await response.json();
    } catch (error) {
      console.error("Error fetching summary:", error);
      return {
        total_workflows: 0,
        executions_today: 0,
        success_rate: 0,
      };
    }
  }

  async getTrends(days: number = 7): Promise<TrendData> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/analytics/trends?days=${days}`
      );
      if (!response.ok) throw new Error("Failed to fetch trends");
      return await response.json();
    } catch (error) {
      console.error("Error fetching trends:", error);
      return this.getMockTrends();
    }
  }

  async getTopWorkflows(limit: number = 5): Promise<TopWorkflow[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/analytics/top-workflows?limit=${limit}`
      );
      if (!response.ok) throw new Error("Failed to fetch top workflows");
      return await response.json();
    } catch (error) {
      console.error("Error fetching top workflows:", error);
      return [];
    }
  }

  async getFailingWorkflows(limit: number = 5): Promise<FailingWorkflow[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/analytics/failing-workflows?limit=${limit}`
      );
      if (!response.ok) throw new Error("Failed to fetch failing workflows");
      return await response.json();
    } catch (error) {
      console.error("Error fetching failing workflows:", error);
      return [];
    }
  }

  async exportAnalytics(format: "json" | "csv" | "pdf" = "json"): Promise<unknown> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/analytics/export?format=${format}`,
        { method: "POST" }
      );
      if (!response.ok) throw new Error("Failed to export analytics");
      return await response.json();
    } catch (error) {
      console.error("Error exporting analytics:", error);
      return null;
    }
  }

  private getMockMetrics(): DashboardMetrics {
    return {
      timestamp: new Date().toISOString(),
      summary: {
        total_workflows: 12,
        executions_today: 24,
        success_rate: 94.5,
      },
      trends: this.getMockTrends(),
      top_workflows: [
        { id: "1", name: "Email Campaign", execution_count: 156 },
        { id: "2", name: "Data Sync", execution_count: 142 },
        { id: "3", name: "Report Generation", execution_count: 98 },
      ],
      failing_workflows: [
        { id: "4", name: "API Integration", failure_count: 5 },
        { id: "5", name: "Data Validation", failure_count: 2 },
      ],
      integration_health: { status: "healthy" },
      error_breakdown: { timeout: 3, validation: 2, auth: 1 },
    };
  }

  private getMockTrends(): TrendData {
    const dates = [];
    const executionCounts = [];
    const successRates = [];
    const avgDurations = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split("T")[0]);
      executionCounts.push(Math.floor(Math.random() * 50) + 20);
      successRates.push(Math.floor(Math.random() * 15) + 85);
      avgDurations.push(Math.floor(Math.random() * 3000) + 1000);
    }

    return { dates, execution_counts: executionCounts, success_rates: successRates, avg_durations: avgDurations };
  }
}

export const analyticsApi = new AnalyticsApi();
