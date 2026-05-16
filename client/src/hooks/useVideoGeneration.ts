/**
 * Hook for monitoring video generation progress
 */

import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';

export interface VideoGenerationStatus {
  id: string;
  state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused';
  progress: number;
  data: {
    capsuleId: number;
    title: string;
  };
  result?: {
    success: boolean;
    videoUrl?: string;
    duration?: number;
  };
  failedReason?: string;
  attemptsMade: number;
}

export function useVideoGeneration(jobId: string | null) {
  const [status, setStatus] = useState<VideoGenerationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(!!jobId);

  // Query job status
  const { data: jobStatus, isLoading } = trpc.studio.getVideoJobStatus.useQuery(
    { jobId: jobId || '' },
    {
      enabled: !!jobId && isPolling,
      refetchInterval: 3000, // Poll every 3 seconds
      refetchOnWindowFocus: false,
    }
  );

  useEffect(() => {
    if (jobStatus) {
      setStatus(jobStatus as VideoGenerationStatus);
      setError(null);

      // Stop polling when job is completed or failed
      if (jobStatus.state === 'completed' || jobStatus.state === 'failed') {
        setIsPolling(false);
      }
    }
  }, [jobStatus]);

  return {
    status,
    error,
    isLoading,
    isPolling,
    progress: status?.progress || 0,
    isCompleted: status?.state === 'completed',
    isFailed: status?.state === 'failed',
    isProcessing: status?.state === 'active' || status?.state === 'waiting',
  };
}
