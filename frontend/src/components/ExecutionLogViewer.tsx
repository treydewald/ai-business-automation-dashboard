import { useEffect, useRef, useState } from 'react';
import type { ExecutionLog } from '@mocks/logs';

interface ExecutionLogViewerProps {
  logs: ExecutionLog[];
  isLive?: boolean;
  className?: string;
}

const LOG_LEVEL_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  success: { text: '#34D399', bg: 'rgba(52, 211, 153, 0.12)', border: 'rgba(52, 211, 153, 0.3)' },
  error: { text: '#F87171', bg: 'rgba(248, 113, 113, 0.12)', border: 'rgba(248, 113, 113, 0.3)' },
  warning: { text: '#FBBF24', bg: 'rgba(251, 191, 36, 0.12)', border: 'rgba(251, 191, 36, 0.3)' },
  info: { text: '#22D3EE', bg: 'rgba(34, 211, 238, 0.12)', border: 'rgba(34, 211, 238, 0.3)' },
  debug: { text: '#A0AEC0', bg: 'rgba(160, 174, 192, 0.08)', border: 'rgba(160, 174, 192, 0.2)' },
};

export function ExecutionLogViewer({
  logs,
  isLive = false,
  className = '',
}: ExecutionLogViewerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setAutoScroll(isAtBottom);
    }
  };

  const formatTime = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className={`flex flex-col h-full rounded-2xl overflow-hidden border-2 border-neon-divider ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(20, 30, 60, 0.95) 0%, rgba(20, 30, 60, 0.9) 100%)',
        boxShadow: '0 0 20px rgba(34, 211, 238, 0.1)',
      }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b-2 border-neon-divider flex items-center justify-between bg-gradient-to-r from-neon-surface-hover to-neon-surface">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-neon-accent animate-pulse shadow-glow-cyan" />
          <h3 className="text-base font-bold text-neon-text">Execution Logs</h3>
          {isLive && (
            <span className="text-xs font-semibold text-neon-accent ml-3 px-2 py-1 rounded-full bg-neon-accent/20 border border-neon-accent/40">
              LIVE
            </span>
          )}
        </div>
        {!autoScroll && (
          <button
            onClick={() => setAutoScroll(true)}
            className="text-xs font-bold text-neon-accent hover:text-white transition-colors px-3 py-1 rounded-lg hover:bg-neon-accent/20"
          >
            ↓ Scroll to latest
          </button>
        )}
      </div>

      {/* Logs container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-2 p-5 font-mono text-xs"
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          scrollBehavior: 'smooth',
        }}
      >
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-neon-text-secondary">
            <div className="text-center">
              <p className="text-sm font-semibold mb-1">No logs yet</p>
              <p className="text-xs">Awaiting execution...</p>
            </div>
          </div>
        ) : (
          logs.map((log) => {
            const colors = LOG_LEVEL_COLORS[log.level] || LOG_LEVEL_COLORS.debug;
            const isExpanded = expandedLogId === log.id;

            return (
              <div key={log.id} className="group">
                <div
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  className="cursor-pointer px-3 py-2.5 rounded-lg hover:bg-neon-surface-hover transition-all flex items-start gap-3 border-l-3"
                  style={{
                    backgroundColor: colors.bg,
                    borderLeftColor: colors.border,
                  }}
                >
                  <span className="text-neon-text-secondary flex-shrink-0 font-mono text-xs font-semibold">
                    {formatTime(log.timestamp)}
                  </span>
                  <span
                    style={{ color: colors.text }}
                    className="font-black flex-shrink-0 text-xs tracking-wider"
                  >
                    {log.level.substring(0, 3).toUpperCase()}
                  </span>
                  <span
                    style={{ color: colors.text }}
                    className="flex-1 font-medium leading-relaxed"
                  >
                    {log.message}
                  </span>
                  {log.metadata && (
                    <span className="text-neon-text-secondary opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity font-bold">
                      ▼
                    </span>
                  )}
                </div>

                {/* Expanded metadata */}
                {isExpanded && log.metadata && (
                  <div className="px-4 py-3 mx-2 mt-1 text-xs text-neon-text-secondary border-l-3 rounded-b-lg"
                    style={{
                      borderLeftColor: colors.border,
                      background: 'rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    {typeof log.metadata === 'object' && (
                      <pre className="overflow-x-auto whitespace-pre-wrap break-words max-w-full font-mono text-xs leading-relaxed">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Live indicator */}
        {isLive && logs.length > 0 && (
          <div className="flex items-center gap-2.5 text-neon-accent font-semibold text-xs mt-3 px-3 py-2">
            <div className="w-2 h-2 rounded-full bg-neon-accent animate-pulse" />
            Live updates active
          </div>
        )}
      </div>
    </div>
  );
}

export default ExecutionLogViewer;
