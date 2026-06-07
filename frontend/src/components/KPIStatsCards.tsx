import type { ReactNode } from 'react';

interface KPICardProps {
  label: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon: ReactNode;
  color?: 'cyan' | 'indigo' | 'green' | 'amber';
}

function KPICard({ label, value, trend, trendLabel, icon, color = 'cyan' }: KPICardProps) {
  const colorMap = {
    cyan: {
      bg: 'rgba(34, 211, 238, 0.15)',
      text: '#22D3EE',
      icon: '#22D3EE',
      border: 'rgba(34, 211, 238, 0.4)',
      glow: '0 0 16px rgba(34, 211, 238, 0.3)',
    },
    indigo: {
      bg: 'rgba(99, 102, 241, 0.15)',
      text: '#6366F1',
      icon: '#6366F1',
      border: 'rgba(99, 102, 241, 0.4)',
      glow: '0 0 16px rgba(99, 102, 241, 0.25)',
    },
    green: {
      bg: 'rgba(52, 211, 153, 0.15)',
      text: '#34D399',
      icon: '#34D399',
      border: 'rgba(52, 211, 153, 0.4)',
      glow: '0 0 16px rgba(52, 211, 153, 0.25)',
    },
    amber: {
      bg: 'rgba(251, 191, 36, 0.15)',
      text: '#FBBF24',
      icon: '#FBBF24',
      border: 'rgba(251, 191, 36, 0.4)',
      glow: '0 0 16px rgba(251, 191, 36, 0.25)',
    },
  };

  const colorScheme = colorMap[color];
  const isTrendPositive = trend !== undefined && trend >= 0;

  return (
    <div
      className="rounded-xl p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer group"
      style={{
        background: `linear-gradient(135deg, rgba(20, 30, 60, 0.9) 0%, rgba(20, 30, 60, 0.8) 100%)`,
        border: `2px solid ${colorScheme.border}`,
        backdropFilter: 'blur(20px)',
        boxShadow: colorScheme.glow,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-neon-text-secondary uppercase tracking-widest mb-3 opacity-80">
            {label}
          </p>
          <p className="text-4xl font-black text-neon-text leading-none mb-2 group-hover:text-current transition-colors">
            {value}
          </p>
          {trendLabel && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className="text-sm font-bold transition-colors"
                style={{
                  color: isTrendPositive ? '#34D399' : '#F87171',
                }}
              >
                <span className="text-lg">{isTrendPositive ? '↗' : '↘'}</span> {trendLabel}
              </span>
            </div>
          )}
        </div>
        <div
          className="flex-shrink-0 w-16 h-16 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
          style={{
            background: colorScheme.bg,
            color: colorScheme.text,
            border: `1px solid ${colorScheme.border}`,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

interface KPIStatsCardsProps {
  runsToday: number;
  successRate: number;
  avgDuration: number;
  totalWorkflows?: number;
  trends?: {
    runsToday?: number;
    successRate?: number;
    avgDuration?: number;
  };
}

export function KPIStatsCards({
  runsToday,
  successRate,
  avgDuration,
  totalWorkflows = 4,
  trends = {},
}: KPIStatsCardsProps) {
  const formatDuration = (ms: number): string => {
    const seconds = (ms / 1000).toFixed(1);
    return `${seconds}s`;
  };

  const formatPercentage = (decimal: number): string => {
    return `${(decimal * 100).toFixed(0)}%`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <KPICard
        label="Runs Today"
        value={runsToday}
        trendLabel={
          trends.runsToday !== undefined ? `${trends.runsToday > 0 ? '+' : ''}${trends.runsToday}%` : undefined
        }
        trend={trends.runsToday}
        icon={
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        }
        color="cyan"
      />

      <KPICard
        label="Success Rate"
        value={formatPercentage(successRate)}
        trendLabel={
          trends.successRate !== undefined ? `${trends.successRate > 0 ? '+' : ''}${trends.successRate}%` : undefined
        }
        trend={trends.successRate}
        icon={
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        }
        color="green"
      />

      <KPICard
        label="Avg Duration"
        value={formatDuration(avgDuration)}
        trendLabel={
          trends.avgDuration !== undefined
            ? `${trends.avgDuration > 0 ? '+' : ''}${formatDuration(trends.avgDuration)}`
            : undefined
        }
        trend={trends.avgDuration ? -trends.avgDuration : undefined}
        icon={
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
          </svg>
        }
        color="indigo"
      />

      <KPICard
        label="Total Workflows"
        value={totalWorkflows}
        icon={
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
        }
        color="amber"
      />
    </div>
  );
}

export default KPIStatsCards;
