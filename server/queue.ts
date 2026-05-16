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

// Create video generation queue
export const videoQueue = new Queue('video-generation', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
    },
    removeOnFail: false, // Keep failed jobs for debugging
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
}

// Add video generation job to queue
export async function enqueueVideoGeneration(data: VideoGenerationJob) {
  try {
    const job = await videoQueue.add(data, {
      jobId: `video-${data.capsuleId}-${Date.now()}`,
    });
    console.log(`[Video Queue] Job ${job.id} enqueued for capsule ${data.capsuleId}`);
    return job;
  } catch (error) {
    console.error('[Video Queue] Failed to enqueue job:', error);
    throw error;
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

// Clean up old jobs
export async function cleanupOldJobs() {
  try {
    const completedCount = await videoQueue.clean(3600000, 'completed'); // 1 hour
    const failedCount = await videoQueue.clean(86400000, 'failed'); // 24 hours
    console.log(`[Video Queue] Cleaned up ${completedCount} completed and ${failedCount} failed jobs`);
  } catch (error) {
    console.error('[Video Queue] Failed to cleanup jobs:', error);
  }
}

// Graceful shutdown
export async function shutdownQueue() {
  try {
    await videoQueue.close();
    console.log('[Video Queue] Queue closed gracefully');
  } catch (error) {
    console.error('[Video Queue] Error closing queue:', error);
  }
}
