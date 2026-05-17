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
import { renderCapsuleVideo, estimateRenderTime, formatFileSize } from '../remotion-render-service';
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
      const estimatedRenderTime = estimateRenderTime(estimatedDuration, 'medium');
      console.log(`[Worker] Estimated render time: ~${estimatedRenderTime}s`);
      
      const tempVideoPath = path.join(process.cwd(), 'tmp', `capsule-${job.data.capsuleId}-${Date.now()}.mp4`);
      
      const renderResult = await renderCapsuleVideo(capsuleData, {
        outputPath: tempVideoPath,
        codec: 'h264',
        quality: 'medium',
        fps: 30,
        width: 1920,
        height: 1080,
      });

      if (!renderResult.success) {
        throw new Error(renderResult.error || 'Video rendering failed');
      }
      
      console.log(`[Worker] Video rendered successfully`);
      console.log(`[Worker] Video size: ${formatFileSize(renderResult.fileSize)}`);

      job.updateProgress(80);

      // Upload video to storage
      console.log(`[Worker] Uploading video to storage...`);
      const videoBuffer = fs.readFileSync(renderResult.videoPath!);
      const videoFileName = `capsule-${job.data.capsuleId}-${Date.now()}.mp4`;
      const videoKey = `videos/capsules/${videoFileName}`;
      
      const { url: videoUrl } = await storagePut(
        videoKey,
        videoBuffer,
        'video/mp4'
      );

      // Clean up temp file
      try {
        if (renderResult.videoPath) {
          fs.unlinkSync(renderResult.videoPath);
          console.log(`[Worker] Cleaned up temporary file`);
        }
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
          fileSize: renderResult.fileSize,
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
    concurrency: 1, // Process one video at a time (video rendering is CPU intensive)
    lockDuration: 3600000, // 1 hour (video rendering can take time)
    lockRenewTime: 300000, // Renew lock every 5 minutes
    maxStalledCount: 1, // Fail after 1 stall
    stalledInterval: 30000, // Check for stalled jobs every 30 seconds
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
