#!/usr/bin/env node

/**
 * Script to generate videos for all pending capsules
 * Usage: node scripts/generate-all-capsule-videos.mjs
 */

import { getDb } from '../server/db.ts';
import { studioCapsules } from '../drizzle/schema.ts';
import { eq } from 'drizzle-orm';
import { enqueueVideoGeneration } from '../server/queue.ts';

async function generateAllCapsuleVideos() {
  console.log('[Script] Starting video generation for all pending capsules...');

  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Failed to connect to database');
    }

    // Get all pending capsules
    const pendingCapsules = await db.select()
      .from(studioCapsules)
      .where(eq(studioCapsules.videoStatus, 'pending'));

    console.log(`[Script] Found ${pendingCapsules.length} pending capsules`);

    if (pendingCapsules.length === 0) {
      console.log('[Script] No pending capsules found');
      process.exit(0);
    }

    // Queue video generation for each capsule
    let successCount = 0;
    let errorCount = 0;

    for (const capsule of pendingCapsules) {
      try {
        console.log(`[Script] Queuing video generation for capsule ${capsule.id}...`);

        const job = await enqueueVideoGeneration({
          capsuleId: capsule.id,
          projectId: capsule.projectId,
          scenarioId: capsule.scenarioId,
          title: capsule.title,
          description: capsule.description || '',
          narrationText: capsule.narrationText || '',
          duration: capsule.duration || 900,
          language: 'fr',
          pedagogicalModel: 'professional',
        });

        console.log(`[Script] ✅ Capsule ${capsule.id} queued with job ID: ${job.id}`);
        successCount++;
      } catch (error) {
        console.error(`[Script] ❌ Failed to queue capsule ${capsule.id}:`, error);
        errorCount++;
      }
    }

    console.log(`\n[Script] Summary:`);
    console.log(`  ✅ Successfully queued: ${successCount}`);
    console.log(`  ❌ Failed: ${errorCount}`);
    console.log(`[Script] Video generation started for ${successCount} capsules`);

    process.exit(errorCount > 0 ? 1 : 0);
  } catch (error) {
    console.error('[Script] Fatal error:', error);
    process.exit(1);
  }
}

generateAllCapsuleVideos();
