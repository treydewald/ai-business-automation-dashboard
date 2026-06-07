export interface PerformanceMetrics {
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
  bundleSize: number;
}

export class PerformanceMonitor {
  static measurePerformance(): PerformanceMetrics {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType("paint");
    const largestContentfulPaint = performance.getEntriesByType("largest-contentful-paint").pop() as PerformanceEntry | undefined;

    const firstPaint =
      paintEntries.find((entry) => entry.name === "first-paint")?.startTime || 0;
    const firstContentfulPaint =
      paintEntries.find((entry) => entry.name === "first-contentful-paint")?.startTime || 0;

    return {
      firstPaint,
      firstContentfulPaint,
      largestContentfulPaint: largestContentfulPaint?.startTime || 0,
      cumulativeLayoutShift: this.measureCLS(),
      timeToInteractive: navigation?.domInteractive || 0,
      bundleSize: this.estimateBundleSize(),
    };
  }

  private static measureCLS(): number {
    let clsScore = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsScore += (entry as any).value;
        }
      }
    });

    try {
      observer.observe({ entryTypes: ["layout-shift"] });
    } catch {
      // LayoutShift not supported
    }

    return clsScore;
  }

  private static estimateBundleSize(): number {
    return Math.round((window.performance as any).memory?.usedJSHeapSize || 0);
  }

  static logPerformanceMetrics(): void {
    const metrics = this.measurePerformance();
    console.table({
      "First Paint (ms)": metrics.firstPaint.toFixed(2),
      "First Contentful Paint (ms)": metrics.firstContentfulPaint.toFixed(2),
      "Largest Contentful Paint (ms)": metrics.largestContentfulPaint.toFixed(2),
      "Cumulative Layout Shift": metrics.cumulativeLayoutShift.toFixed(3),
      "Time to Interactive (ms)": metrics.timeToInteractive.toFixed(2),
      "Heap Usage (bytes)": metrics.bundleSize,
    });
  }

  static reportWebVitals(_callback: (metric: any) => void): void {
    // web-vitals integration not available in this build
  }
}
