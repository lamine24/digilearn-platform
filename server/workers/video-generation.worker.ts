/**
 * Video Generation Worker
 * Processes video generation jobs from the Bull queue
 */

import { Worker } from 'bullmq';
import type { Job } from 'bullmq';
import { getDb } from '../db';
import { studioCapsules } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { generateCapsuleVideoContent } from '../video-generation';
import type { VideoGenerationJob } from '../queue';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

// Create worker
export const videoGenerationWorker = new Worker(
  'video-generation',
  async (job: Job<VideoGenerationJob>) => {
    console.log(`[Worker] Processing job ${job.id} for capsule ${job.data.capsuleId}`);

    try {
      // Update job progress
      job.updateProgress(10);

      // Get database connection
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }

      // Update capsule status to 'processing'
      await db.update(studioCapsules)
        .set({ videoStatus: 'processing' })
        .where(eq(studioCapsules.id, job.data.capsuleId));

      job.updateProgress(20);

      // Generate video content
      console.log(`[Worker] Generating video for capsule ${job.data.capsuleId}`);
      const videoResult = await generateCapsuleVideoContent({
        title: job.data.title,
        description: job.data.description || '',
        narrationText: job.data.narrationText,
        duration: job.data.duration,
        language: job.data.language,
        pedagogicalModel: job.data.pedagogicalModel,
      });

      job.updateProgress(80);

      // Update capsule with video information
      await db.update(studioCapsules)
        .set({
          videoUrl: videoResult.videoUrl,
          videoKey: videoResult.videoKey,
          videoStatus: 'completed',
          duration: videoResult.duration,
        })
        .where(eq(studioCapsules.id, job.data.capsuleId));

      job.updateProgress(100);

      console.log(`[Worker] Job ${job.id} completed successfully`);
      return {
        success: true,
        videoUrl: videoResult.videoUrl,
        duration: videoResult.duration,
      };
    } catch (error) {
      console.error(`[Worker] Job ${job.id} failed:`, error);

      // Update capsule status to 'error'
      try {
        const db = await getDb();
        if (db) {
          await db.update(studioCapsules)
            .set({
              videoStatus: 'failed',
            })
            .where(eq(studioCapsules.id, job.data.capsuleId));
        }
      } catch (dbError) {
        console.error('[Worker] Failed to update capsule status:', dbError);
      }

      throw error;
    }
  },
  {
    connection: redisConfig,
    concurrency: 2, // Process 2 videos simultaneously
    lockDuration: 30000, // 30 seconds
    lockRenewTime: 15000, // Renew lock every 15 seconds
    maxStalledCount: 2, // Max times a job can stall
    stalledInterval: 5000, // Check for stalled jobs every 5 seconds
  }
);

// Worker event listeners
videoGenerationWorker.on('completed', (job: any) => {
  console.log(`[Worker] Job ${job.id} completed`);
});

videoGenerationWorker.on('failed', (job: any, err: any) => {
  console.error(`[Worker] Job ${job.id} failed:`, err.message);
});

videoGenerationWorker.on('error', (err: any) => {
  console.error('[Worker] Worker error:', err);
});

videoGenerationWorker.on('stalled', (job: any) => {
  console.warn(`[Worker] Job ${job.id} stalled`);
});

// Graceful shutdown
export async function shutdownWorker() {
  try {
    await videoGenerationWorker.close();
    console.log('[Worker] Worker closed gracefully');
  } catch (error) {
    console.error('[Worker] Error closing worker:', error);
  }
}

// Start worker
export function startWorker() {
  console.log('[Worker] Video generation worker started');
  return videoGenerationWorker;
}
