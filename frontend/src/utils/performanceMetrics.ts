/**
 * Performance metrics tracking for monitoring Web Vitals and custom metrics
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  unit?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];

  constructor() {
    // Initialize monitor
  }

  /**
   * Track Largest Contentful Paint (LCP)
   */
  trackLCP(callback: (metric: PerformanceMetric) => void): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          const metric: PerformanceMetric = {
            name: 'LCP',
            value: lastEntry.renderTime || lastEntry.loadTime || lastEntry.startTime || 0,
            timestamp: performance.now(),
            unit: 'ms',
          };
          this.metrics.push(metric);
          callback(metric);
        });

        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.warn('LCP observation failed:', e);
      }
    }
  }

  /**
   * Track First Input Delay (FID) / Interaction to Next Paint (INP)
   */
  trackINP(callback: (metric: PerformanceMetric) => void): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            const metric: PerformanceMetric = {
              name: 'INP',
              value: (entry as any).duration,
              timestamp: performance.now(),
              unit: 'ms',
            };
            this.metrics.push(metric);
            callback(metric);
          });
        });

        observer.observe({ entryTypes: ['first-input', 'interaction'] });
      } catch (e) {
        console.warn('INP observation failed:', e);
      }
    }
  }

  /**
   * Track Cumulative Layout Shift (CLS)
   */
  trackCLS(callback: (metric: PerformanceMetric) => void): void {
    if ('PerformanceObserver' in window) {
      try {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              const firstSessionEntry =
                clsValue + entry.value;
              clsValue = firstSessionEntry;

              const metric: PerformanceMetric = {
                name: 'CLS',
                value: clsValue,
                timestamp: performance.now(),
                unit: 'score',
              };
              this.metrics.push(metric);
              callback(metric);
            }
          });
        });

        observer.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('CLS observation failed:', e);
      }
    }
  }

  /**
   * Measure custom performance metrics
   */
  measureCustom(name: string, startMark: string, endMark?: string): PerformanceMetric {
    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }

      const measure = performance.getEntriesByName(name)[0];
      const metric: PerformanceMetric = {
        name,
        value: measure.duration,
        timestamp: performance.now(),
        unit: 'ms',
      };
      this.metrics.push(metric);
      return metric;
    } catch (e) {
      console.warn(`Custom measure ${name} failed:`, e);
      return {
        name,
        value: 0,
        timestamp: performance.now(),
      };
    }
  }

  /**
   * Get all tracked metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Send metrics to analytics service
   */
  async sendMetrics(endpoint: string): Promise<void> {
    if (this.metrics.length === 0) return;

    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: this.metrics,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
        keepalive: true,
      });
    } catch (e) {
      console.warn('Failed to send metrics:', e);
    }
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Initialize performance tracking on page load
 */
export const initializePerformanceTracking = (analyticsEndpoint?: string): void => {
  if (typeof window === 'undefined') return;

  performanceMonitor.trackLCP((metric) => {
    console.debug('LCP:', metric.value, 'ms');
  });

  performanceMonitor.trackINP((metric) => {
    console.debug('INP:', metric.value, 'ms');
  });

  performanceMonitor.trackCLS((metric) => {
    console.debug('CLS:', metric.value);
  });

  // Send metrics on page unload
  if (analyticsEndpoint) {
    window.addEventListener('unload', () => {
      performanceMonitor.sendMetrics(analyticsEndpoint);
    });
  }
};
