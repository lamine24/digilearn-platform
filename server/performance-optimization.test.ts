/**
 * Performance Optimization Tests
 * Tests for caching, parallelization, and performance monitoring
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CacheService, NarrationCache, CompositionCache, RenderResultCache } from './cache-service';
import { RenderTaskQueue, RenderWorkerPool, ParallelRenderManager } from './parallel-render-manager';
import { PerformanceMonitor } from './performance-monitor';

describe('Cache Service', () => {
  let cache: CacheService<string>;

  beforeEach(() => {
    cache = new CacheService({
      maxSize: 10 * 1024 * 1024,
      maxEntries: 100,
      ttl: 60000,
    });
  });

  describe('Basic Operations', () => {
    it('should set and get values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for missing keys', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('should check key existence', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should delete keys', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeNull();
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });
  });

  describe('Statistics', () => {
    it('should track cache hits and misses', () => {
      cache.set('key1', 'value1');
      cache.get('key1');
      cache.get('key1');
      cache.get('nonexistent');

      const stats = cache.getStats();
      expect(stats.hitRate).toBeGreaterThan(0);
      expect(stats.missRate).toBeGreaterThan(0);
    });

    it('should calculate average entry size', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const stats = cache.getStats();
      expect(stats.averageEntrySize).toBeGreaterThan(0);
      expect(stats.totalEntries).toBe(2);
    });
  });
});

describe('Specialized Caches', () => {
  it('should create narration cache', () => {
    const cache = new NarrationCache();
    const key = cache.generateKey('test text', 'fr');
    cache.set(key, { audioUrl: 'test.mp3', duration: 10 });
    expect(cache.get(key)).toEqual({ audioUrl: 'test.mp3', duration: 10 });
  });

  it('should create composition cache', () => {
    const cache = new CompositionCache();
    const key = cache.generateKey('capsule-1', 'v1');
    cache.set(key, { compositionUrl: 'comp.json', duration: 30 });
    expect(cache.get(key)).toEqual({ compositionUrl: 'comp.json', duration: 30 });
  });

  it('should create render result cache', () => {
    const cache = new RenderResultCache();
    const key = cache.generateKey('capsule-1', 'high', 30, 'h264');
    cache.set(key, { videoUrl: 'video.mp4', duration: 30, fileSize: 1024000 });
    expect(cache.get(key)).toEqual({ videoUrl: 'video.mp4', duration: 30, fileSize: 1024000 });
  });
});

describe('Render Task Queue', () => {
  let queue: RenderTaskQueue;

  beforeEach(() => {
    queue = new RenderTaskQueue(100);
  });

  it('should enqueue and dequeue tasks', () => {
    const task = {
      id: 'task-1',
      jobId: 'job-1',
      capsuleId: 'capsule-1',
      priority: 5,
      status: 'pending' as const,
      retries: 0,
      maxRetries: 3,
    };

    expect(queue.enqueue(task)).toBe(true);
    expect(queue.size()).toBe(1);
    expect(queue.dequeue()).toEqual(task);
    expect(queue.isEmpty()).toBe(true);
  });

  it('should sort by priority', () => {
    const task1 = {
      id: 'task-1',
      jobId: 'job-1',
      capsuleId: 'capsule-1',
      priority: 3,
      status: 'pending' as const,
      retries: 0,
      maxRetries: 3,
    };

    const task2 = {
      id: 'task-2',
      jobId: 'job-2',
      capsuleId: 'capsule-2',
      priority: 8,
      status: 'pending' as const,
      retries: 0,
      maxRetries: 3,
    };

    queue.enqueue(task1);
    queue.enqueue(task2);

    const first = queue.dequeue();
    expect(first?.priority).toBe(8);
  });

  it('should reject when full', () => {
    const smallQueue = new RenderTaskQueue(1);
    const task1 = {
      id: 'task-1',
      jobId: 'job-1',
      capsuleId: 'capsule-1',
      priority: 5,
      status: 'pending' as const,
      retries: 0,
      maxRetries: 3,
    };
    const task2 = {
      id: 'task-2',
      jobId: 'job-2',
      capsuleId: 'capsule-2',
      priority: 5,
      status: 'pending' as const,
      retries: 0,
      maxRetries: 3,
    };

    expect(smallQueue.enqueue(task1)).toBe(true);
    expect(smallQueue.enqueue(task2)).toBe(false);
  });
});

describe('Render Worker Pool', () => {
  let pool: RenderWorkerPool;

  beforeEach(() => {
    pool = new RenderWorkerPool({
      maxConcurrentRenders: 4,
      maxQueueSize: 100,
    });
  });

  it('should initialize with correct capacity', () => {
    const stats = pool.getStats();
    expect(stats.totalWorkers).toBe(4);
    expect(stats.activeWorkers).toBe(0);
    expect(stats.idleWorkers).toBe(4);
  });

  it('should track active workers', () => {
    const task = {
      id: 'task-1',
      jobId: 'job-1',
      capsuleId: 'capsule-1',
      priority: 5,
      status: 'pending' as const,
      retries: 0,
      maxRetries: 3,
    };

    pool.addTask(task);
    pool.startTask('task-1');

    const stats = pool.getStats();
    expect(stats.activeWorkers).toBe(1);
    expect(stats.idleWorkers).toBe(3);
  });

  it('should calculate utilization', () => {
    const task = {
      id: 'task-1',
      jobId: 'job-1',
      capsuleId: 'capsule-1',
      priority: 5,
      status: 'pending' as const,
      retries: 0,
      maxRetries: 3,
    };

    pool.addTask(task);
    pool.startTask('task-1');

    const utilization = pool.getUtilization();
    expect(utilization).toBe(25);
  });
});

describe('Parallel Render Manager', () => {
  let manager: ParallelRenderManager;

  beforeEach(() => {
    manager = new ParallelRenderManager({
      maxConcurrentRenders: 4,
    });
  });

  it('should submit jobs', () => {
    const result = manager.submitJob('job-1', 'capsule-1', 5);
    expect(result).toBe(true);
  });

  it('should get next task', () => {
    manager.submitJob('job-1', 'capsule-1', 5);
    const task = manager.getNextTask();
    expect(task).toBeDefined();
    expect(task?.jobId).toBe('job-1');
  });

  it('should complete tasks', () => {
    manager.submitJob('job-1', 'capsule-1', 5);
    const task = manager.getNextTask();
    if (task) {
      manager.completeTask(task.id);
      const stats = manager.getStats();
      expect(stats.activeTasks).toBe(0);
    }
  });
});

describe('Performance Monitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  it('should record metrics', () => {
    monitor.recordMetric('test_metric', 100, 'ms');
    const history = monitor.getMetricHistory('test_metric');
    expect(history.length).toBe(1);
    expect(history[0].value).toBe(100);
  });

  it('should track render times', () => {
    monitor.recordRenderTime(1000);
    monitor.recordRenderTime(2000);
    monitor.recordRenderTime(1500);

    const stats = monitor.getRenderTimeStats();
    expect(stats.min).toBe(1000);
    expect(stats.max).toBe(2000);
    expect(stats.average).toBeCloseTo(1500, 0);
  });

  it('should calculate cache hit rate', () => {
    monitor.recordCacheHit();
    monitor.recordCacheHit();
    monitor.recordCacheMiss();

    const hitRate = monitor.getCacheHitRate();
    expect(hitRate).toBeCloseTo(66.67, 1);
  });

  it('should calculate error rate', () => {
    monitor.recordJobSubmitted();
    monitor.recordJobSubmitted();
    monitor.recordJobSubmitted();
    monitor.recordJobFailed();

    const errorRate = monitor.getErrorRate();
    expect(errorRate).toBeCloseTo(33.33, 1);
  });

  it('should reset statistics', () => {
    monitor.recordMetric('test', 100);
    monitor.recordJobSubmitted();
    monitor.reset();

    const history = monitor.getMetricHistory('test');
    expect(history.length).toBe(0);
  });
});
