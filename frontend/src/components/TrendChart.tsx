import type { TrendDataPoint } from '@services/analyticsApi';

interface TrendChartProps {
  data: TrendDataPoint[];
  title?: string;
}

export function TrendChart({ data, title }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400">
        No trend data available
      </div>
    );
  }

  const maxExecutions = Math.max(...data.map((d) => d.executions));
  const chartHeight = 120;

  return (
    <div className="w-full">
      {title && <h3 className="text-sm font-medium text-gray-700 mb-4">{title}</h3>}
      <div className="flex items-end gap-2 h-32">
        {data.map((point, i) => {
          const barHeight = Math.round((point.executions / maxExecutions) * chartHeight);
          const successColor = point.success_rate >= 95 ? 'bg-green-500' : point.success_rate >= 85 ? 'bg-blue-500' : 'bg-yellow-500';
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div
                className={`w-full rounded-t ${successColor} transition-all duration-300`}
                style={{ height: `${barHeight}px` }}
                title={`${point.date}: ${point.executions} executions (${point.success_rate.toFixed(1)}% success)`}
              />
              <p className="text-xs text-gray-400 truncate w-full text-center">
                {point.date.slice(5)}
              </p>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-sm inline-block" /> ≥95% success</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-sm inline-block" /> ≥85% success</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-500 rounded-sm inline-block" /> &lt;85% success</span>
      </div>
    </div>
  );
}
