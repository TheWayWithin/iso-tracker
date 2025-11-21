// apps/web/lib/performance/metrics.ts
interface PerformanceMetric {
  operation: string;
  duration: number;
  windowCount?: number;
  ephemerisPoints?: number;
  timestamp: number;
}

export class PerformanceMetrics {
  private static metrics: PerformanceMetric[] = [];
  private static readonly MAX_METRICS = 100; // Keep last 100 metrics

  /**
   * Measure execution time of a function
   */
  static measureVisibilityCalculation(fn: () => void): number {
    const start = performance.now();
    fn();
    const end = performance.now();
    return end - start;
  }

  /**
   * Measure async function execution time
   */
  static async measureAsync<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    return { result, duration: end - start };
  }

  /**
   * Log metrics to console in development
   */
  static logMetrics(operation: string, duration: number): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${operation}: ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Track performance metric
   */
  static trackPerformance(metric: {
    operation: string;
    duration: number;
    windowCount?: number;
    ephemerisPoints?: number;
  }): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now()
    };

    // Add to metrics array
    this.metrics.push(fullMetric);

    // Keep only last MAX_METRICS entries
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }

    // Log in development
    this.logMetrics(metric.operation, metric.duration);

    // Send to analytics (PostHog) if available
    if (typeof window !== 'undefined' && (window as any).posthog) {
      try {
        (window as any).posthog.capture('performance_metric', {
          operation: metric.operation,
          duration: metric.duration,
          window_count: metric.windowCount,
          ephemeris_points: metric.ephemerisPoints
        });
      } catch (error) {
        console.warn('Failed to send performance metric to PostHog:', error);
      }
    }

    // Warn if performance target missed
    if (metric.operation === 'visibility-calculation' && metric.duration > 2000) {
      console.warn(`Performance target missed: ${metric.operation} took ${metric.duration.toFixed(2)}ms (target: <2000ms)`);
    }
  }

  /**
   * Get performance statistics
   */
  static getStats(): {
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    totalOperations: number;
    recentMetrics: PerformanceMetric[];
  } {
    if (this.metrics.length === 0) {
      return {
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        totalOperations: 0,
        recentMetrics: []
      };
    }

    const durations = this.metrics.map(m => m.duration);
    const sum = durations.reduce((a, b) => a + b, 0);

    return {
      averageDuration: sum / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      totalOperations: this.metrics.length,
      recentMetrics: this.metrics.slice(-10) // Last 10 metrics
    };
  }

  /**
   * Clear all tracked metrics
   */
  static clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Export metrics as CSV (for analysis)
   */
  static exportMetrics(): string {
    const headers = 'timestamp,operation,duration,windowCount,ephemerisPoints\n';
    const rows = this.metrics.map(m =>
      `${m.timestamp},${m.operation},${m.duration},${m.windowCount || ''},${m.ephemerisPoints || ''}`
    ).join('\n');

    return headers + rows;
  }

  /**
   * Check if performance targets are being met
   */
  static checkTargets(): {
    currentStatusTarget: boolean; // <100ms
    forecastTarget: boolean;      // <2000ms
    warnings: string[];
  } {
    const statusMetrics = this.metrics.filter(m => m.operation.includes('current-status'));
    const forecastMetrics = this.metrics.filter(m => m.operation.includes('visibility-calculation'));

    const warnings: string[] = [];

    // Check current status target (<100ms)
    const slowStatusCalls = statusMetrics.filter(m => m.duration > 100);
    const currentStatusTarget = slowStatusCalls.length === 0;

    if (!currentStatusTarget) {
      warnings.push(`${slowStatusCalls.length} current status calls exceeded 100ms target`);
    }

    // Check forecast target (<2000ms)
    const slowForecastCalls = forecastMetrics.filter(m => m.duration > 2000);
    const forecastTarget = slowForecastCalls.length === 0;

    if (!forecastTarget) {
      warnings.push(`${slowForecastCalls.length} forecast calls exceeded 2000ms target`);
    }

    return {
      currentStatusTarget,
      forecastTarget,
      warnings
    };
  }
}

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    PerformanceMetrics.clearMetrics();
  });
}
