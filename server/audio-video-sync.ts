/**
 * Audio-Video Synchronization Service
 * Handles timing and synchronization between audio narration and video animations
 */

import type { TTSSegment } from './tts-service';

export interface SyncTimeline {
  videoFrame: number;
  audioTime: number; // milliseconds
  fps: number;
  duration: number; // seconds
}

export interface AudioSyncMarker {
  frame: number;
  audioTime: number; // milliseconds
  label: string;
  type: 'section_start' | 'section_end' | 'emphasis' | 'pause' | 'transition';
}

export interface VideoSyncConfig {
  fps: number;
  videoDuration: number; // seconds
  audioDuration: number; // seconds
  audioSegments: TTSSegment[];
}

/**
 * Convert milliseconds to video frame number
 */
export function msToFrame(ms: number, fps: number): number {
  return Math.round((ms / 1000) * fps);
}

/**
 * Convert video frame number to milliseconds
 */
export function frameToMs(frame: number, fps: number): number {
  return Math.round((frame / fps) * 1000);
}

/**
 * Convert video frame number to seconds
 */
export function frameToSeconds(frame: number, fps: number): number {
  return frame / fps;
}

/**
 * Convert seconds to video frame number
 */
export function secondsToFrame(seconds: number, fps: number): number {
  return Math.round(seconds * fps);
}

/**
 * Get audio time for a given video frame
 */
export function getAudioTimeForFrame(
  frame: number,
  fps: number,
  audioOffset: number = 0
): number {
  const frameTimeMs = frameToMs(frame, fps);
  return frameTimeMs + audioOffset;
}

/**
 * Get video frame for a given audio time
 */
export function getFrameForAudioTime(
  audioTime: number,
  fps: number,
  audioOffset: number = 0
): number {
  const adjustedTime = audioTime - audioOffset;
  return msToFrame(adjustedTime, fps);
}

/**
 * Create sync markers for audio segments
 */
export function createSyncMarkers(
  audioSegments: TTSSegment[],
  fps: number,
  audioOffset: number = 0
): AudioSyncMarker[] {
  const markers: AudioSyncMarker[] = [];

  for (let i = 0; i < audioSegments.length; i++) {
    const segment = audioSegments[i];

    // Start marker
    markers.push({
      frame: getFrameForAudioTime(segment.startTime, fps, audioOffset),
      audioTime: segment.startTime,
      label: `Segment ${i + 1} Start`,
      type: 'section_start',
    });

    // End marker
    markers.push({
      frame: getFrameForAudioTime(segment.endTime, fps, audioOffset),
      audioTime: segment.endTime,
      label: `Segment ${i + 1} End`,
      type: 'section_end',
    });

    // Transition marker (between segments)
    if (i < audioSegments.length - 1) {
      const transitionTime = segment.endTime + 200; // 200ms transition
      markers.push({
        frame: getFrameForAudioTime(transitionTime, fps, audioOffset),
        audioTime: transitionTime,
        label: `Transition ${i + 1}`,
        type: 'transition',
      });
    }
  }

  return markers.sort((a, b) => a.frame - b.frame);
}

/**
 * Find the appropriate audio segment for a video frame
 */
export function findAudioSegmentForFrame(
  frame: number,
  fps: number,
  audioSegments: TTSSegment[],
  audioOffset: number = 0
): TTSSegment | null {
  const audioTime = getAudioTimeForFrame(frame, fps, audioOffset);

  for (const segment of audioSegments) {
    if (audioTime >= segment.startTime && audioTime < segment.endTime) {
      return segment;
    }
  }

  return null;
}

/**
 * Calculate animation timing for audio segment
 */
export function calculateAnimationTiming(
  segment: TTSSegment,
  fps: number,
  animationDuration: number = 0.5 // seconds
): {
  startFrame: number;
  endFrame: number;
  duration: number;
} {
  const startFrame = msToFrame(segment.startTime, fps);
  const endFrame = msToFrame(segment.endTime, fps);
  const duration = frameToSeconds(endFrame - startFrame, fps);

  return {
    startFrame,
    endFrame,
    duration: Math.max(duration, animationDuration),
  };
}

/**
 * Detect emphasis points in audio (for highlighting)
 */
export function detectEmphasisPoints(
  audioSegments: TTSSegment[],
  fps: number,
  audioOffset: number = 0
): AudioSyncMarker[] {
  const markers: AudioSyncMarker[] = [];

  // Add emphasis at the start of each segment
  for (let i = 0; i < audioSegments.length; i++) {
    const segment = audioSegments[i];
    const emphasisTime = segment.startTime + 100; // 100ms into segment

    if (emphasisTime < segment.endTime) {
      markers.push({
        frame: getFrameForAudioTime(emphasisTime, fps, audioOffset),
        audioTime: emphasisTime,
        label: `Emphasis ${i + 1}`,
        type: 'emphasis',
      });
    }
  }

  return markers;
}

/**
 * Create pause markers between segments
 */
export function createPauseMarkers(
  audioSegments: TTSSegment[],
  fps: number,
  pauseDuration: number = 500, // milliseconds
  audioOffset: number = 0
): AudioSyncMarker[] {
  const markers: AudioSyncMarker[] = [];

  for (let i = 0; i < audioSegments.length - 1; i++) {
    const currentSegment = audioSegments[i];
    const nextSegment = audioSegments[i + 1];

    // Check if there's a gap between segments
    const gap = nextSegment.startTime - currentSegment.endTime;
    if (gap >= pauseDuration) {
      const pauseTime = currentSegment.endTime + gap / 2;

      markers.push({
        frame: getFrameForAudioTime(pauseTime, fps, audioOffset),
        audioTime: pauseTime,
        label: `Pause ${i + 1}`,
        type: 'pause',
      });
    }
  }

  return markers;
}

/**
 * Calculate overall sync timeline
 */
export function calculateSyncTimeline(config: VideoSyncConfig): SyncTimeline[] {
  const timeline: SyncTimeline[] = [];
  const totalFrames = Math.ceil(config.videoDuration * config.fps);

  for (let frame = 0; frame < totalFrames; frame += Math.ceil(config.fps / 10)) {
    // Every 100ms
    const audioTime = frameToMs(frame, config.fps);

    timeline.push({
      videoFrame: frame,
      audioTime: Math.min(audioTime, config.audioDuration * 1000),
      fps: config.fps,
      duration: config.videoDuration,
    });
  }

  return timeline;
}

/**
 * Check if audio and video are in sync
 */
export function checkSyncStatus(
  videoFrame: number,
  audioTime: number,
  fps: number,
  tolerance: number = 100 // milliseconds
): { inSync: boolean; drift: number } {
  const expectedAudioTime = frameToMs(videoFrame, fps);
  const drift = Math.abs(expectedAudioTime - audioTime);

  return {
    inSync: drift <= tolerance,
    drift,
  };
}

/**
 * Adjust audio offset to match video timing
 */
export function adjustAudioOffset(
  videoFrame: number,
  currentAudioTime: number,
  fps: number
): number {
  const expectedAudioTime = frameToMs(videoFrame, fps);
  return expectedAudioTime - currentAudioTime;
}

/**
 * Create animation keyframes synchronized with audio
 */
export function createAudioSyncedKeyframes(
  audioSegments: TTSSegment[],
  fps: number,
  animationType: 'fade' | 'slide' | 'scale' = 'fade'
): Array<{
  frame: number;
  value: number;
  easing: string;
}> {
  const keyframes: Array<{ frame: number; value: number; easing: string }> = [];

  for (const segment of audioSegments) {
    const startFrame = msToFrame(segment.startTime, fps);
    const endFrame = msToFrame(segment.endTime, fps);
    const midFrame = Math.round((startFrame + endFrame) / 2);

    switch (animationType) {
      case 'fade':
        keyframes.push(
          { frame: startFrame - 10, value: 0, easing: 'easeIn' },
          { frame: startFrame, value: 1, easing: 'linear' },
          { frame: endFrame, value: 1, easing: 'linear' },
          { frame: endFrame + 10, value: 0, easing: 'easeOut' }
        );
        break;

      case 'slide':
        keyframes.push(
          { frame: startFrame, value: -100, easing: 'easeOut' },
          { frame: midFrame, value: 0, easing: 'linear' },
          { frame: endFrame, value: 100, easing: 'easeIn' }
        );
        break;

      case 'scale':
        keyframes.push(
          { frame: startFrame, value: 0.8, easing: 'easeOut' },
          { frame: midFrame, value: 1, easing: 'linear' },
          { frame: endFrame, value: 1.1, easing: 'easeIn' }
        );
        break;
    }
  }

  return keyframes;
}

/**
 * Format sync information for logging
 */
export function formatSyncInfo(
  frame: number,
  audioTime: number,
  fps: number
): string {
  const seconds = frameToSeconds(frame, fps);
  const audioSeconds = audioTime / 1000;

  return `Frame: ${frame} (${seconds.toFixed(2)}s) | Audio: ${audioSeconds.toFixed(2)}s`;
}

/**
 * Validate sync configuration
 */
export function validateSyncConfig(config: VideoSyncConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (config.fps <= 0) {
    errors.push('FPS must be greater than 0');
  }

  if (config.videoDuration <= 0) {
    errors.push('Video duration must be greater than 0');
  }

  if (config.audioDuration <= 0) {
    errors.push('Audio duration must be greater than 0');
  }

  if (config.audioSegments.length === 0) {
    errors.push('At least one audio segment is required');
  }

  // Check for overlapping segments
  for (let i = 0; i < config.audioSegments.length - 1; i++) {
    if (config.audioSegments[i].endTime > config.audioSegments[i + 1].startTime) {
      errors.push(`Audio segments ${i} and ${i + 1} overlap`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
