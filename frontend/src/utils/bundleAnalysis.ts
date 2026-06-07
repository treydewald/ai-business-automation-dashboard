/**
 * Bundle size and performance analysis utilities
 */

export interface BundleMetrics {
  totalSize: number;
  gzipSize: number;
  chunks: ChunkMetric[];
  timestamp: number;
}

export interface ChunkMetric {
  name: string;
  size: number;
  gzipSize?: number;
  modules?: number;
}

/**
 * Estimate bundle size from loaded scripts
 */
export const estimateBundleSize = (): BundleMetrics => {
  const chunks: ChunkMetric[] = [];
  let totalSize = 0;

  // Get all loaded script elements
  const scripts = document.querySelectorAll('script[src]');
  scripts.forEach((script) => {
    const src = script.getAttribute('src') || '';
    // Try to extract size from src if available (e.g., from build metadata)
    const sizeMatch = src.match(/\?size=(\d+)/);
    const size = sizeMatch ? parseInt(sizeMatch[1]) : 0;

    chunks.push({
      name: src.split('/').pop() || 'unknown',
      size,
    });

    totalSize += size;
  });

  return {
    totalSize,
    gzipSize: Math.ceil(totalSize * 0.35), // Rough gzip estimate
    chunks,
    timestamp: Date.now(),
  };
};

/**
 * Check bundle size against thresholds
 */
export interface BundleSizeThresholds {
  warn?: number; // Warn if over this size (bytes)
  error?: number; // Error if over this size (bytes)
}

export const checkBundleSize = (
  metrics: BundleMetrics,
  thresholds: BundleSizeThresholds = {
    warn: 256 * 1024, // 256KB
    error: 512 * 1024, // 512KB
  }
): 'ok' | 'warn' | 'error' => {
  const size = metrics.totalSize;

  if (thresholds.error && size > thresholds.error) {
    console.error(`Bundle size exceeds error threshold: ${(size / 1024).toFixed(2)}KB`);
    return 'error';
  }

  if (thresholds.warn && size > thresholds.warn) {
    console.warn(`Bundle size exceeds warn threshold: ${(size / 1024).toFixed(2)}KB`);
    return 'warn';
  }

  return 'ok';
};

/**
 * Analyze JavaScript execution time
 */
export const measureScriptExecution = (callback: () => void, label: string = 'Script Execution'): number => {
  const start = performance.now();
  callback();
  const duration = performance.now() - start;

  console.debug(`${label}: ${duration.toFixed(2)}ms`);
  return duration;
};

/**
 * Detect unused CSS/JavaScript
 * (Note: This is a simplified implementation)
 */
export const analyzeUnusedCode = (): void => {
  // This would require more sophisticated tooling
  // but we can at least log current coverage if available
  if ('__coverage__' in window) {
    console.debug('Code coverage data available for analysis');
  }
};

/**
 * Format bytes to human-readable size
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * Math.pow(10, dm)) / Math.pow(10, dm) + ' ' + sizes[i];
};
