/**
 * Bull Queue Configuration
 * Manages video generation jobs asynchronously
 */

import Queue from 'bull';
import Redis from 'redis';

// Redis connection options
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

// Create video generation queue with optimized settings
export const videoQueue = new Queue('video-generation', {
  redis: redisConfig,
  settings: {
    // Performance optimizations
    maxStalledCount: 2,
    stalledInterval: 5000,
    maxRetriesPerSecond: 10,
    retryProcessDelay: 5000,
    visibility: 30000,
    lockDuration: 30000,
    lockRenewTime: 15000,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600,
      isPattern: false,
    },
    removeOnFail: false,
    timeout: 3600000,
    priority: 5,
  },
});

// Queue event listeners
videoQueue.on('completed', (job) => {
  console.log(`[Video Queue] Job ${job.id} completed successfully`);
});

videoQueue.on('failed', (job, err) => {
  console.error(`[Video Queue] Job ${job.id} failed:`, err.message);
});

videoQueue.on('error', (err) => {
  console.error('[Video Queue] Queue error:', err);
});

videoQueue.on('stalled', (job) => {
  console.warn(`[Video Queue] Job ${job.id} stalled`);
});

// Job data interface
export interface VideoGenerationJob {
  capsuleId: number;
  projectId: number;
  scenarioId: number;
  title: string;
  description: string;
  narrationText: string;
  duration: number;
  language: string;
  pedagogicalModel: string;
  contentStructure?: Record<string, any>;
  interactiveElements?: Record<string, any>;
}

// Add video generation job to queue with priority support
export async function enqueueVideoGeneration(
  data: VideoGenerationJob,
  priority: number = 5,
  delay?: number
) {
  try {
    const jobOptions: any = {
      jobId: `video-${data.capsuleId}-${Date.now()}`,
      priority,
    };

    if (delay) {
      jobOptions.delay = delay;
    }

    const job = await videoQueue.add(data, jobOptions);
    console.log(
      `[Video Queue] Job ${job.id} enqueued for capsule ${data.capsuleId} (priority: ${priority})`
    );
    return job;
  } catch (error) {
    console.error('[Video Queue] Failed to enqueue job:', error);
    throw error;
  }
}

// Get queue statistics
export async function getQueueStats() {
  try {
    const counts = await videoQueue.getJobCounts();
    const workers = videoQueue.workers.length;
    
    return {
      active: counts.active,
      completed: counts.completed,
      failed: counts.failed,
      delayed: counts.delayed,
      waiting: counts.waiting,
      paused: counts.paused,
      workers,
      isPaused: videoQueue.isPaused(),
    };
  } catch (error) {
    console.error('[Video Queue] Failed to get queue stats:', error);
    return null;
  }
}

// Pause queue
export async function pauseQueue() {
  try {
    await videoQueue.pause();
    console.log('[Video Queue] Queue paused');
  } catch (error) {
    console.error('[Video Queue] Failed to pause queue:', error);
  }
}

// Resume queue
export async function resumeQueue() {
  try {
    await videoQueue.resume();
    console.log('[Video Queue] Queue resumed');
  } catch (error) {
    console.error('[Video Queue] Failed to resume queue:', error);
  }
}

// Get job status
export async function getJobStatus(jobId: string) {
  try {
    const job = await videoQueue.getJob(jobId);
    if (!job) return null;

    const progress = job.progress();
    const state = await job.getState();

    return {
      id: job.id,
      state,
      progress,
      data: job.data,
      result: job.returnvalue,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
    };
  } catch (error) {
    console.error('[Video Queue] Failed to get job status:', error);
    return null;
  }
}

// Clean up old jobs with aggressive cleanup
export async function cleanupOldJobs() {
  try {
    const completedCount = await videoQueue.clean(3600000, 'completed');
    const failedCount = await videoQueue.clean(86400000, 'failed');
    const delayedCount = await videoQueue.clean(604800000, 'delayed');
    
    console.log(
      `[Video Queue] Cleaned up ${completedCount} completed, ${failedCount} failed, and ${delayedCount} delayed jobs`
    );
  } catch (error) {
    console.error('[Video Queue] Failed to cleanup jobs:', error);
  }
}

// Get queue health
export async function getQueueHealth() {
  try {
    const stats = await getQueueStats();
    const isHealthy = stats && stats.active < 100 && stats.failed < 50;
    
    return {
      healthy: isHealthy,
      stats,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[Video Queue] Failed to get queue health:', error);
    return {
      healthy: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Graceful shutdown with cleanup
export async function shutdownQueue() {
  try {
    await pauseQueue();
    
    const stats = await getQueueStats();
    if (stats && stats.active > 0) {
      console.log(`[Video Queue] Waiting for ${stats.active} active jobs to complete...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    
    await cleanupOldJobs();
    
    await videoQueue.close();
    console.log('[Video Queue] Queue closed gracefully');
  } catch (error) {
    console.error('[Video Queue] Error closing queue:', error);
  }
}
