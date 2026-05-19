/**
 * useVideoProgress Hook
 * Track video generation progress in real-time
 */

import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/lib/trpc';

export interface VideoProgress {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  eta?: number;
  error?: string;
  videoUrl?: string;
}

interface UseVideoProgressOptions {
  jobId?: string;
  enabled?: boolean;
  pollInterval?: number;
}

/**
 * Hook to track video generation progress
 */
export function useVideoProgress(options: UseVideoProgressOptions = {}) {
  const { jobId, enabled = true, pollInterval = 1000 } = options;

  const [progress, setProgress] = useState<VideoProgress | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Query for job status
  const statusQuery = trpc.studio.getVideoGenerationStatus.useQuery(
    { jobId: jobId || '' },
    {
      enabled: enabled && !!jobId,
      refetchInterval: isPolling ? pollInterval : false,
    }
  );

  // Update progress when status changes
  useEffect(() => {
    if (statusQuery.data) {
      setProgress(statusQuery.data);

      // Stop polling when completed or failed
      if (statusQuery.data.status === 'completed' || statusQuery.data.status === 'failed') {
        setIsPolling(false);
      }
    }
  }, [statusQuery.data]);

  // Start polling when job is provided
  useEffect(() => {
    if (jobId && enabled) {
      setIsPolling(true);
    }
  }, [jobId, enabled]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  const startPolling = useCallback(() => {
    setIsPolling(true);
  }, []);

  return {
    progress,
    isLoading: statusQuery.isLoading,
    isPolling,
    stopPolling,
    startPolling,
    refetch: statusQuery.refetch,
  };
}

/**
 * Hook to manage video generation
 */
export function useVideoGeneration() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateMutation = trpc.studio.generateCapsuleVideo.useMutation();
  const progressHook = useVideoProgress({
    jobId: jobId || undefined,
    enabled: !!jobId,
  });

  const startGeneration = async (capsuleId: string, voiceId: string, options?: any) => {
    setIsGenerating(true);

    try {
      const result = await generateMutation.mutateAsync({
        capsuleId,
        voiceId,
        processingPreset: options?.processingPreset,
        equalizerPreset: options?.equalizerPreset,
      });

      if (result.jobId) {
        setJobId(result.jobId);
      }

      return result;
    } catch (error) {
      setIsGenerating(false);
      throw error;
    }
  };

  const stopGeneration = () => {
    progressHook.stopPolling();
    setIsGenerating(false);
  };

  return {
    startGeneration,
    stopGeneration,
    jobId,
    isGenerating,
    ...progressHook,
  };
}
