/**
 * Initialize Video Generation Worker
 * This file starts the video generation worker process
 */

import { startWorker, shutdownWorker } from './workers/video-generation.worker';
import { shutdownQueue } from './queue';

// Start the worker
export function initializeWorker() {
  console.log('[Init] Starting video generation worker...');
  
  try {
    const worker = startWorker();
    
    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('[Init] SIGTERM received, shutting down gracefully...');
      await shutdownWorker();
      await shutdownQueue();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('[Init] SIGINT received, shutting down gracefully...');
      await shutdownWorker();
      await shutdownQueue();
      process.exit(0);
    });

    console.log('[Init] Video generation worker initialized successfully');
    return worker;
  } catch (error) {
    console.error('[Init] Failed to initialize worker:', error);
    throw error;
  }
}

// Export for use in main server file
export default initializeWorker;
