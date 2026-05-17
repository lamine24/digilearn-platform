/**
 * Video Generation Worker
 * Processes video generation jobs from the Bull queue
 */

import { Worker } from 'bullmq';
import type { Job } from 'bullmq';
import { getDb } from '../db';
import { studioCapsules } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { validateCapsuleData, estimateCapsuleDuration } from '../remotion-renderer';
import { renderCapsuleVideoWithRemotion } from '../remotion-server-renderer';
import { storagePut } from '../storage';
import type { VideoGenerationJob } from '../queue';
import type { CapsuleData } from '../video-generation';
import path from 'path';
import fs from 'fs';

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

      // Prepare capsule data
      const capsuleData: CapsuleData = {
        title: job.data.title,
        description: job.data.description || '',
        narrationText: job.data.narrationText,
        contentStructure: job.data.contentStructure as any,
        interactiveElements: job.data.interactiveElements as any,
      };

      // Validate capsule data
      const validation = validateCapsuleData(capsuleData);
      if (!validation.valid) {
        throw new Error(`Invalid capsule data: ${validation.errors.join(', ')}`);
      }

      job.updateProgress(30);

      // Estimate duration
      const estimatedDuration = estimateCapsuleDuration(capsuleData);
      console.log(`[Worker] Estimated duration: ${estimatedDuration}s`);

      job.updateProgress(40);

      // Render video using Remotion
      console.log(`[Worker] Rendering video for capsule ${job.data.capsuleId}`);
      const tempVideoPath = path.join(process.cwd(), 'tmp', `capsule-${job.data.capsuleId}-${Date.now()}.mp4`);
      
      const renderResult = await renderCapsuleVideoWithRemotion({
        data: capsuleData,
        outputPath: tempVideoPath,
        durationInSeconds: estimatedDuration,
        onProgress: (progress) => {
          const jobProgress = 40 + (progress * 0.4); // 40-80% for rendering
          job.updateProgress(Math.round(jobProgress));
        },
      });

      if (!renderResult.success || !renderResult.videoPath) {
        throw new Error(renderResult.error || 'Video rendering failed');
      }

      job.updateProgress(80);

      // Upload video to storage
      console.log(`[Worker] Uploading video to storage...`);
      const videoBuffer = fs.readFileSync(renderResult.videoPath);
      const videoFileName = `capsule-${job.data.capsuleId}-${Date.now()}.mp4`;
      const videoKey = `videos/capsules/${videoFileName}`;
      
      const { url: videoUrl } = await storagePut(
        videoKey,
        videoBuffer,
        'video/mp4'
      );

      // Clean up temp file
      try {
        fs.unlinkSync(renderResult.videoPath);
      } catch (error) {
        console.warn(`[Worker] Failed to delete temp file: ${renderResult.videoPath}`);
      }

      job.updateProgress(90);

      // Update capsule with video information
      await db.update(studioCapsules)
        .set({
          videoUrl,
          videoKey,
          videoStatus: 'completed',
          duration: estimatedDuration,
          generatedAt: new Date(),
          generatedBy: 'reemotion',
        })
        .where(eq(studioCapsules.id, job.data.capsuleId));

      job.updateProgress(100);

      console.log(`[Worker] Job ${job.id} completed successfully`);
      return {
        success: true,
        videoUrl,
        duration: estimatedDuration,
      };
    } catch (error) {
      console.error(`[Worker] Job ${job.id} failed:`, error);

      // Update capsule status to 'failed'
      try {
        const db = await getDb();
        if (db) {
          await db.update(studioCapsules)
            .set({
              videoStatus: 'failed',
              generatedAt: new Date(),
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
    concurrency: 1, // Process one video at a time to avoid resource exhaustion
    lockDuration: 60000, // 60 seconds
    lockRenewTime: 30000, // Renew lock every 30 seconds
    maxStalledCount: 2, // Max times a job can stall
    stalledInterval: 10000, // Check for stalled jobs every 10 seconds
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
