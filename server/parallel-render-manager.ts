/**
 * Parallel Render Manager
 * Manages parallel video rendering with resource pooling and load balancing
 */

import type { VideoGenerationJob } from './queue';
import type { CapsuleData } from './video-generation';

export interface RenderTask {
  id: string;
  jobId: string;
  capsuleId: string;
  priority: number; // 0-10, higher = more important
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
  duration?: number;
  error?: string;
  retries: number;
  maxRetries: number;
}

export interface RenderWorkerPool {
  totalWorkers: number;
  activeWorkers: number;
  idleWorkers: number;
  queueSize: number;
  averageTaskTime: number;
  totalTasksCompleted: number;
}

export interface ParallelRenderConfig {
  maxConcurrentRenders: number;
  maxQueueSize: number;
  taskTimeout: number; // milliseconds
  retryAttempts: number;
  loadBalancingStrategy: 'round-robin' | 'least-loaded' | 'priority';
}

/**
 * Task queue for parallel rendering
 */
export class RenderTaskQueue {
  private queue: RenderTask[] = [];
  private maxQueueSize: number;

  constructor(maxQueueSize: number = 1000) {
    this.maxQueueSize = maxQueueSize;
  }

  /**
   * Add task to queue
   */
  enqueue(task: RenderTask): boolean {
    if (this.queue.length >= this.maxQueueSize) {
      console.warn(`[Render Queue] Queue full (${this.queue.length}/${this.maxQueueSize})`);
      return false;
    }

    this.queue.push(task);
    // Sort by priority (higher priority first)
    this.queue.sort((a, b) => b.priority - a.priority);
    console.log(`[Render Queue] Task enqueued: ${task.id} (priority: ${task.priority})`);
    return true;
  }

  /**
   * Dequeue next task
   */
  dequeue(): RenderTask | null {
    return this.queue.shift() || null;
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue = [];
    console.log('[Render Queue] Cleared');
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    size: number;
    avgPriority: number;
    minPriority: number;
    maxPriority: number;
  } {
    if (this.queue.length === 0) {
      return {
        size: 0,
        avgPriority: 0,
        minPriority: 0,
        maxPriority: 0,
      };
    }

    const priorities = this.queue.map((t) => t.priority);
    const avgPriority = priorities.reduce((a, b) => a + b, 0) / priorities.length;

    return {
      size: this.queue.length,
      avgPriority,
      minPriority: Math.min(...priorities),
      maxPriority: Math.max(...priorities),
    };
  }
}

/**
 * Worker pool for parallel rendering
 */
export class RenderWorkerPool {
  private config: ParallelRenderConfig;
  private taskQueue: RenderTaskQueue;
  private activeWorkers: Set<string> = new Set();
  private completedTasks: number = 0;
  private failedTasks: number = 0;
  private totalRenderTime: number = 0;

  constructor(config: Partial<ParallelRenderConfig> = {}) {
    this.config = {
      maxConcurrentRenders: config.maxConcurrentRenders || 4,
      maxQueueSize: config.maxQueueSize || 1000,
      taskTimeout: config.taskTimeout || 60 * 60 * 1000, // 1 hour
      retryAttempts: config.retryAttempts || 3,
      loadBalancingStrategy: config.loadBalancingStrategy || 'priority',
    };

    this.taskQueue = new RenderTaskQueue(this.config.maxQueueSize);

    console.log(`[Render Pool] Initialized with ${this.config.maxConcurrentRenders} workers`);
  }

  /**
   * Add task to queue
   */
  addTask(task: RenderTask): boolean {
    return this.taskQueue.enqueue(task);
  }

  /**
   * Get next task to process
   */
  getNextTask(): RenderTask | null {
    if (this.activeWorkers.size >= this.config.maxConcurrentRenders) {
      return null; // All workers busy
    }

    return this.taskQueue.dequeue();
  }

  /**
   * Mark task as started
   */
  startTask(taskId: string): void {
    this.activeWorkers.add(taskId);
    console.log(
      `[Render Pool] Task started: ${taskId} (active: ${this.activeWorkers.size}/${this.config.maxConcurrentRenders})`
    );
  }

  /**
   * Mark task as completed
   */
  completeTask(taskId: string, duration: number): void {
    this.activeWorkers.delete(taskId);
    this.completedTasks++;
    this.totalRenderTime += duration;

    const avgTime = this.totalRenderTime / this.completedTasks;
    console.log(
      `[Render Pool] Task completed: ${taskId} (duration: ${duration}ms, avg: ${avgTime.toFixed(0)}ms)`
    );
  }

  /**
   * Mark task as failed
   */
  failTask(taskId: string, error: string): void {
    this.activeWorkers.delete(taskId);
    this.failedTasks++;
    console.error(`[Render Pool] Task failed: ${taskId} - ${error}`);
  }

  /**
   * Get pool statistics
   */
  getStats(): RenderWorkerPool {
    return {
      totalWorkers: this.config.maxConcurrentRenders,
      activeWorkers: this.activeWorkers.size,
      idleWorkers: this.config.maxConcurrentRenders - this.activeWorkers.size,
      queueSize: this.taskQueue.size(),
      averageTaskTime:
        this.completedTasks > 0 ? this.totalRenderTime / this.completedTasks : 0,
      totalTasksCompleted: this.completedTasks,
    };
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    return this.taskQueue.getStats();
  }

  /**
   * Check if pool is at capacity
   */
  isAtCapacity(): boolean {
    return this.activeWorkers.size >= this.config.maxConcurrentRenders;
  }

  /**
   * Check if queue is full
   */
  isQueueFull(): boolean {
    return this.taskQueue.size() >= this.config.maxQueueSize;
  }

  /**
   * Get utilization percentage
   */
  getUtilization(): number {
    return (this.activeWorkers.size / this.config.maxConcurrentRenders) * 100;
  }

  /**
   * Print pool statistics
   */
  printStats(): void {
    const stats = this.getStats();
    const queueStats = this.getQueueStats();

    console.log(`
[Render Pool Statistics]
  Workers: ${stats.activeWorkers}/${stats.totalWorkers} active
  Queue: ${stats.queueSize} tasks
  Completed: ${stats.totalTasksCompleted}
  Failed: ${this.failedTasks}
  Avg Task Time: ${stats.averageTaskTime.toFixed(0)}ms
  Utilization: ${this.getUtilization().toFixed(1)}%
  Queue Avg Priority: ${queueStats.avgPriority.toFixed(2)}
    `);
  }
}

/**
 * Parallel render manager
 */
export class ParallelRenderManager {
  private pool: RenderWorkerPool;
  private activeTasks: Map<string, RenderTask> = new Map();
  private taskTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(config?: Partial<ParallelRenderConfig>) {
    this.pool = new RenderWorkerPool(config);
  }

  /**
   * Submit render job
   */
  submitJob(
    jobId: string,
    capsuleId: string,
    priority: number = 5,
    maxRetries: number = 3
  ): boolean {
    const task: RenderTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      jobId,
      capsuleId,
      priority,
      status: 'pending',
      retries: 0,
      maxRetries,
    };

    const added = this.pool.addTask(task);

    if (added) {
      this.activeTasks.set(task.id, task);
      console.log(
        `[Render Manager] Job submitted: ${jobId} (task: ${task.id}, priority: ${priority})`
      );
    } else {
      console.warn(`[Render Manager] Failed to submit job: ${jobId}`);
    }

    return added;
  }

  /**
   * Get next task to process
   */
  getNextTask(): RenderTask | null {
    const task = this.pool.getNextTask();

    if (task) {
      task.status = 'running';
      task.startTime = Date.now();
      this.pool.startTask(task.id);

      // Set task timeout
      const timeout = setTimeout(() => {
        this.handleTaskTimeout(task.id);
      }, this.pool['config'].taskTimeout);

      this.taskTimeouts.set(task.id, timeout);

      console.log(`[Render Manager] Processing task: ${task.id}`);
    }

    return task;
  }

  /**
   * Mark task as completed
   */
  completeTask(taskId: string): void {
    const task = this.activeTasks.get(taskId);

    if (!task) {
      console.warn(`[Render Manager] Task not found: ${taskId}`);
      return;
    }

    task.status = 'completed';
    task.endTime = Date.now();
    task.duration = task.endTime - (task.startTime || 0);

    this.pool.completeTask(taskId, task.duration);
    this.clearTaskTimeout(taskId);
    this.activeTasks.delete(taskId);

    console.log(`[Render Manager] Task completed: ${taskId} (${task.duration}ms)`);
  }

  /**
   * Mark task as failed
   */
  failTask(taskId: string, error: string): void {
    const task = this.activeTasks.get(taskId);

    if (!task) {
      console.warn(`[Render Manager] Task not found: ${taskId}`);
      return;
    }

    task.error = error;

    if (task.retries < task.maxRetries) {
      // Retry task
      task.retries++;
      task.status = 'pending';
      task.priority += 2; // Increase priority for retries

      this.pool.addTask(task);
      console.log(`[Render Manager] Task retried: ${taskId} (attempt ${task.retries})`);
    } else {
      // Task failed permanently
      task.status = 'failed';
      this.pool.failTask(taskId, error);
      this.activeTasks.delete(taskId);
    }

    this.clearTaskTimeout(taskId);
  }

  /**
   * Handle task timeout
   */
  private handleTaskTimeout(taskId: string): void {
    console.warn(`[Render Manager] Task timeout: ${taskId}`);
    this.failTask(taskId, 'Task timeout');
  }

  /**
   * Clear task timeout
   */
  private clearTaskTimeout(taskId: string): void {
    const timeout = this.taskTimeouts.get(taskId);
    if (timeout) {
      clearTimeout(timeout);
      this.taskTimeouts.delete(taskId);
    }
  }

  /**
   * Get manager statistics
   */
  getStats() {
    return {
      pool: this.pool.getStats(),
      queue: this.pool.getQueueStats(),
      activeTasks: this.activeTasks.size,
    };
  }

  /**
   * Get pool utilization
   */
  getUtilization(): number {
    return this.pool.getUtilization();
  }

  /**
   * Print statistics
   */
  printStats(): void {
    console.log('\n=== Parallel Render Manager Statistics ===');
    this.pool.printStats();
    console.log(`Active Tasks: ${this.activeTasks.size}`);
  }
}
