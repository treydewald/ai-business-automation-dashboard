import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import type { ExecutionLog } from '../types';
import { Button } from './Button';
import { Input } from './Form/Input';
import { Badge } from './Badge';

interface LogViewerProps {
  executionId: string;
}

export function LogViewer({ executionId }: LogViewerProps) {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [stepFilter, setStepFilter] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/executions/${executionId}/logs`);
        if (!response.ok) throw new Error('Failed to load logs');
        const data = await response.json();
        setLogs(Array.isArray(data) ? data : data.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, [executionId]);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'text-red-600';
      case 'WARN':
        return 'text-yellow-600';
      case 'INFO':
        return 'text-blue-600';
      case 'DEBUG':
        return 'text-gray-500';
      default:
        return 'text-gray-700';
    }
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'error';
      case 'WARN':
        return 'warning';
      case 'INFO':
        return 'default';
      case 'DEBUG':
        return 'default';
      default:
        return 'default';
    }
  };

  const filteredLogs = logs.filter((log) => {
    let match = true;
    if (search) {
      match = match && (log.message.toLowerCase().includes(search.toLowerCase()) ||
                        log.step_name.toLowerCase().includes(search.toLowerCase()));
    }
    if (levelFilter) {
      match = match && log.level === levelFilter;
    }
    if (stepFilter) {
      match = match && log.step_name === stepFilter;
    }
    return match;
  });

  const stepNames = [...new Set(logs.map((l) => l.step_name))];

  const handleExport = (format: 'json' | 'csv' | 'txt') => {
    let content = '';
    const filename = `logs_${executionId}_${new Date().getTime()}`;

    if (format === 'json') {
      content = JSON.stringify(filteredLogs, null, 2);
    } else if (format === 'csv') {
      content = 'timestamp,level,step,message\n';
      filteredLogs.forEach((log) => {
        content += `"${log.timestamp}","${log.level}","${log.step_name}","${log.message.replace(/"/g, '""')}"\n`;
      });
    } else {
      content = filteredLogs
        .map((log) => `[${log.timestamp}] ${log.level} ${log.step_name}: ${log.message}`)
        .join('\n');
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return <div className="text-red-600">Error loading logs: {error}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="space-y-3">
        <Input
          placeholder="Search logs..."
          value={search}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={levelFilter}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setLevelFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Levels</option>
            <option value="DEBUG">DEBUG</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
          </select>

          <select
            value={stepFilter}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setStepFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Steps</option>
            {stepNames.map((step) => (
              <option key={step} value={step}>
                {step}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded"
              />
              <span>Auto-scroll</span>
            </label>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => handleExport('json')}>
            Export JSON
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleExport('csv')}>
            Export CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleExport('txt')}>
            Export TXT
          </Button>
        </div>
      </div>

      {/* Logs */}
      <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto">
        {loading && logs.length === 0 ? (
          <div className="text-gray-400">Loading logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-gray-400">No logs match the filters</div>
        ) : (
          <div className="space-y-1">
            {filteredLogs.map((log, index) => (
              <div key={index} className="text-gray-100 hover:bg-gray-800 px-2 py-1">
                <span className="text-gray-500">[{log.timestamp}]</span>
                <span className="ml-2">
                  <Badge variant={getLevelBadgeColor(log.level)} className="inline-block">
                    {log.level}
                  </Badge>
                </span>
                <span className="ml-2 text-blue-400">{log.step_name}:</span>
                <span className={`ml-2 ${getLevelColor(log.level)}`}>{log.message}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
