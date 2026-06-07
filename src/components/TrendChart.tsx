/**
 * TrendChart component for displaying trend data
 */
import React, { useMemo } from "react";

interface TrendChartProps {
  title: string;
  data: number[];
  labels: string[];
  color?: "blue" | "green" | "red" | "purple";
  height?: number;
  className?: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  title,
  data,
  labels,
  color = "blue",
  height = 300,
  className = "",
}) => {
  const colorMap = {
    blue: "#3b82f6",
    green: "#10b981",
    red: "#ef4444",
    purple: "#8b5cf6",
  };

  const stats = useMemo(() => {
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const avg = data.length > 0 ? data.reduce((a, b) => a + b, 0) / data.length : 0;
    return { max, min, avg };
  }, [data]);

  const barWidth = data.length > 0 ? 100 / data.length : 0;
  const barGap = data.length > 1 ? 0.5 : 0;

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>

      <div
        className="flex items-end justify-around"
        style={{ height: `${height}px` }}
      >
        {data.map((value, index) => {
          const percentage = stats.max > 0 ? (value / stats.max) * 100 : 0;
          return (
            <div
              key={index}
              className="flex flex-col items-center"
              style={{ width: `${barWidth - barGap}%` }}
            >
              <div
                className="w-full rounded-t transition-all duration-300 hover:opacity-80 cursor-pointer"
                style={{
                  height: `${percentage}%`,
                  backgroundColor: colorMap[color],
                  minHeight: "4px",
                }}
                title={`${labels[index]}: ${value}`}
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
                {labels[index]}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Max</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {Math.round(stats.max)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Average</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {Math.round(stats.avg)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Min</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {Math.round(stats.min)}
          </p>
        </div>
      </div>
    </div>
  );
};
