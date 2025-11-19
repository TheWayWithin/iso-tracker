/**
 * Performance Monitoring Utilities
 *
 * Lightweight utilities for tracking performance metrics in development.
 * In production, these could be connected to an APM service.
 */

export class PerformanceMonitor {
  private static timers: Map<string, number> = new Map();

  /**
   * Start a performance timer
   */
  static start(label: string): void {
    this.timers.set(label, performance.now());
  }

  /**
   * End a performance timer and log the duration
   */
  static end(label: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      console.warn(`[Performance] No timer found for: ${label}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
    this.timers.delete(label);
    return duration;
  }

  /**
   * Measure the execution time of an async function
   */
  static async measureAsync<T>(
    label: string,
    fn: () => Promise<T>
  ): Promise<T> {
    this.start(label);
    try {
      const result = await fn();
      this.end(label);
      return result;
    } catch (error) {
      this.end(label);
      throw error;
    }
  }

  /**
   * Measure the execution time of a synchronous function
   */
  static measure<T>(label: string, fn: () => T): T {
    this.start(label);
    try {
      const result = fn();
      this.end(label);
      return result;
    } catch (error) {
      this.end(label);
      throw error;
    }
  }
}

/**
 * Debounce utility for limiting function call frequency
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle utility for limiting function execution rate
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
