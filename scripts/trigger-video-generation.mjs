#!/usr/bin/env node

/**
 * Script to trigger video generation for all pending capsules via tRPC API
 * Usage: node scripts/trigger-video-generation.mjs
 */

import fetch from 'node-fetch';

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const TRPC_ENDPOINT = `${API_BASE}/api/trpc`;

// List of capsule IDs to generate videos for
const CAPSULE_IDS = [180001, 150002, 150001, 120002, 120001, 90001];

async function triggerVideoGeneration() {
  console.log('[Script] Starting video generation for pending capsules...');
  console.log(`[Script] API Base: ${API_BASE}`);
  console.log(`[Script] Capsules to process: ${CAPSULE_IDS.join(', ')}`);

  let successCount = 0;
  let errorCount = 0;

  for (const capsuleId of CAPSULE_IDS) {
    try {
      console.log(`\n[Script] Triggering video generation for capsule ${capsuleId}...`);

      const response = await fetch(`${TRPC_ENDPOINT}/studio.generateCapsuleVideo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json: {
            capsuleId,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.result?.data?.jobId) {
        console.log(`[Script] ✅ Capsule ${capsuleId} queued with job ID: ${data.result.data.jobId}`);
        console.log(`[Script]    Message: ${data.result.data.message}`);
        successCount++;
      } else if (data.error) {
        throw new Error(data.error.message || 'Unknown error');
      } else {
        console.log(`[Script] Response:`, JSON.stringify(data, null, 2));
        successCount++;
      }
    } catch (error) {
      console.error(`[Script] ❌ Failed to trigger capsule ${capsuleId}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n[Script] Summary:`);
  console.log(`  ✅ Successfully triggered: ${successCount}`);
  console.log(`  ❌ Failed: ${errorCount}`);
  console.log(`[Script] Video generation started for ${successCount} capsules`);

  process.exit(errorCount > 0 ? 1 : 0);
}

triggerVideoGeneration();
