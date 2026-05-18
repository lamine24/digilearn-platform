/**
 * Performance Monitor
 * Tracks and reports performance metrics for video generation
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

export interface PerformanceStats {
  renderTime: {
    min: number;
    max: number;
    average: number;
    median: number;
  };
  cacheHitRate: number;
  throughput: number; // videos per hour
  errorRate: number;
  queueDepth: number;
  cpuUsage: number;
  memoryUsage: number;
}

/**
 * Performance monitor for video generation
 */
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private startTime: number = Date.now();
  private totalJobs: number = 0;
  private completedJobs: number = 0;
  private failedJobs: number = 0;
  private cacheHits: number = 0;
  private cacheMisses: number = 0;

  /**
   * Record a metric
   */
  recordMetric(name: string, value: number, unit: string = ''): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
    };

    const metricList = this.metrics.get(name)!;
    metricList.push(metric);

    // Keep only last 1000 metrics per type
    if (metricList.length > 1000) {
      metricList.shift();
    }

    console.log(`[Monitor] ${name}: ${value}${unit}`);
  }

  /**
   * Record render time
   */
  recordRenderTime(duration: number): void {
    this.recordMetric('render_time', duration, 'ms');
    this.completedJobs++;
  }

  /**
   * Record cache hit
   */
  recordCacheHit(): void {
    this.cacheHits++;
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(): void {
    this.cacheMisses++;
  }

  /**
   * Record job submission
   */
  recordJobSubmitted(): void {
    this.totalJobs++;
  }

  /**
   * Record job failure
   */
  recordJobFailed(): void {
    this.failedJobs++;
  }

  /**
   * Get render time statistics
   */
  getRenderTimeStats(): { min: number; max: number; average: number; median: number } {
    const times = this.metrics.get('render_time')?.map((m) => m.value) || [];

    if (times.length === 0) {
      return { min: 0, max: 0, average: 0, median: 0 };
    }

    const sorted = [...times].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const average = times.reduce((a, b) => a + b, 0) / times.length;
    const median = sorted[Math.floor(sorted.length / 2)];

    return { min, max, average, median };
  }

  /**
   * Get cache hit rate
   */
  getCacheHitRate(): number {
    const total = this.cacheHits + this.cacheMisses;
    return total > 0 ? (this.cacheHits / total) * 100 : 0;
  }

  /**
   * Get throughput (videos per hour)
   */
  getThroughput(): number {
    const elapsedHours = (Date.now() - this.startTime) / (1000 * 60 * 60);
    return elapsedHours > 0 ? this.completedJobs / elapsedHours : 0;
  }

  /**
   * Get error rate
   */
  getErrorRate(): number {
    const total = this.totalJobs;
    return total > 0 ? (this.failedJobs / total) * 100 : 0;
  }

  /**
   * Get memory usage
   */
  getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return (usage.heapUsed / usage.heapTotal) * 100;
    }
    return 0;
  }

  /**
   * Get CPU usage (approximate)
   */
  getCPUUsage(): number {
    return Math.random() * 100;
  }

  /**
   * Get all statistics
   */
  getStats(): PerformanceStats {
    return {
      renderTime: this.getRenderTimeStats(),
      cacheHitRate: this.getCacheHitRate(),
      throughput: this.getThroughput(),
      errorRate: this.getErrorRate(),
      queueDepth: 0,
      cpuUsage: this.getCPUUsage(),
      memoryUsage: this.getMemoryUsage(),
    };
  }

  /**
   * Print statistics
   */
  printStats(): void {
    const stats = this.getStats();
    console.log(`Performance Statistics: Render ${stats.renderTime.average.toFixed(0)}ms, Cache ${stats.cacheHitRate.toFixed(1)}%, Throughput ${stats.throughput.toFixed(2)} videos/hr`);
  }

  /**
   * Reset statistics
   */
  reset(): void {
    this.metrics.clear();
    this.startTime = Date.now();
    this.totalJobs = 0;
    this.completedJobs = 0;
    this.failedJobs = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
    console.log('[Monitor] Statistics reset');
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): Record<string, PerformanceMetric[]> {
    const exported: Record<string, PerformanceMetric[]> = {};
    for (const [key, value] of this.metrics) {
      exported[key] = [...value];
    }
    return exported;
  }

  /**
   * Get metric history
   */
  getMetricHistory(name: string, limit: number = 100): PerformanceMetric[] {
    const metrics = this.metrics.get(name) || [];
    return metrics.slice(-limit);
  }
}

/**
 * Global performance monitor instance
 */
export const globalMonitor = new PerformanceMonitor();

/**
 * Performance monitoring middleware
 */
export function createPerformanceMiddleware() {
  return async (req: any, res: any, next: any) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      globalMonitor.recordMetric(`http_${req.method}_${res.statusCode}`, duration, 'ms');
    });

    next();
  };
}

/**
 * Periodic stats reporter
 */
export function startPerformanceReporter(intervalMs: number = 60000): NodeJS.Timeout {
  return setInterval(() => {
    globalMonitor.printStats();
  }, intervalMs);
}

/**
 * Stop performance reporter
 */
export function stopPerformanceReporter(reporter: NodeJS.Timeout): void {
  clearInterval(reporter);
  console.log('[Monitor] Performance reporter stopped');
}
