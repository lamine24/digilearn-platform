/**
 * Video TTS Integration Service
 * Integrates text-to-speech with video generation pipeline
 */

import type { CapsuleData } from './video-generation';
import type { TTSConfig, TTSResult, TTSSegment } from './tts-service';
import {
  generateAudio,
  generateAudioBatch,
  estimateReadingTime,
  segmentText,
} from './tts-service';
import {
  createSyncMarkers,
  findAudioSegmentForFrame,
  calculateAnimationTiming,
  calculateSyncTimeline,
  validateSyncConfig,
  type AudioSyncMarker,
  type VideoSyncConfig,
} from './audio-video-sync';
import { storagePut } from './storage';

export interface VideoWithAudioConfig {
  capsuleData: CapsuleData;
  ttsConfig: TTSConfig;
  fps: number;
  videoDuration: number;
}

export interface VideoAudioResult {
  success: boolean;
  videoPath?: string;
  audioPath?: string;
  audioUrl?: string;
  syncMarkers: AudioSyncMarker[];
  audioSegments: TTSSegment[];
  totalDuration: number;
  error?: string;
}

export interface AudioSyncInfo {
  segmentIndex: number;
  frame: number;
  audioTime: number;
  text: string;
  animationTiming: {
    startFrame: number;
    endFrame: number;
    duration: number;
  };
}

/**
 * Prepare capsule data for TTS processing
 */
export function prepareCapsuleForTTS(capsuleData: CapsuleData): {
  narrationText: string;
  sections: Array<{ title: string; content: string }>;
} {
  const sections: Array<{ title: string; content: string }> = [];

  // Add title
  if (capsuleData.title) {
    sections.push({
      title: 'Title',
      content: capsuleData.title,
    });
  }

  // Add description
  if (capsuleData.description) {
    sections.push({
      title: 'Description',
      content: capsuleData.description,
    });
  }

  // Add content sections
  if (capsuleData.contentStructure?.sections) {
    for (const section of capsuleData.contentStructure.sections) {
      sections.push({
        title: section.title,
        content: section.content,
      });
    }
  }

  // Combine all text for narration
  const narrationText = sections.map((s) => s.content).join(' ');

  return {
    narrationText,
    sections,
  };
}

/**
 * Generate audio for entire capsule
 */
export async function generateCapsuleAudio(
  capsuleData: CapsuleData,
  ttsConfig: TTSConfig
): Promise<TTSResult> {
  try {
    console.log('[Video TTS] Preparing capsule for audio generation');

    const { narrationText } = prepareCapsuleForTTS(capsuleData);

    if (!narrationText || narrationText.trim().length === 0) {
      throw new Error('No text content to generate audio from');
    }

    console.log(`[Video TTS] Generating audio for ${narrationText.length} characters`);
    console.log(`[Video TTS] Language: ${ttsConfig.language}`);

    const audioResult = await generateAudio(narrationText, ttsConfig);

    console.log(`[Video TTS] Audio generated successfully`);
    console.log(`[Video TTS] Duration: ${audioResult.duration}s`);
    console.log(`[Video TTS] Segments: ${audioResult.segments.length}`);

    return audioResult;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Video TTS] Audio generation failed: ${errorMessage}`);
    throw new Error(`Capsule audio generation failed: ${errorMessage}`);
  }
}

/**
 * Generate audio for individual sections
 */
export async function generateSectionAudio(
  sections: Array<{ title: string; content: string }>,
  ttsConfig: TTSConfig
): Promise<Array<{ section: string; audio: TTSResult }>> {
  try {
    console.log(`[Video TTS] Generating audio for ${sections.length} sections`);

    const results: Array<{ section: string; audio: TTSResult }> = [];

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      console.log(`[Video TTS] Processing section ${i + 1}/${sections.length}: ${section.title}`);

      const audioResult = await generateAudio(section.content, ttsConfig);

      results.push({
        section: section.title,
        audio: audioResult,
      });
    }

    console.log(`[Video TTS] Section audio generation completed`);

    return results;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Video TTS] Section audio generation failed: ${errorMessage}`);
    throw new Error(`Section audio generation failed: ${errorMessage}`);
  }
}

/**
 * Create sync markers for video animations
 */
export function createVideoSyncMarkers(
  audioSegments: TTSSegment[],
  fps: number
): AudioSyncMarker[] {
  try {
    console.log(`[Video TTS] Creating sync markers for ${audioSegments.length} segments`);

    const markers = createSyncMarkers(audioSegments, fps);

    console.log(`[Video TTS] Created ${markers.length} sync markers`);

    return markers;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Video TTS] Sync marker creation failed: ${errorMessage}`);
    throw new Error(`Sync marker creation failed: ${errorMessage}`);
  }
}

/**
 * Get audio sync information for a specific video frame
 */
export function getAudioSyncForFrame(
  frame: number,
  fps: number,
  audioSegments: TTSSegment[],
  capsuleData: CapsuleData
): AudioSyncInfo | null {
  try {
    const audioSegment = findAudioSegmentForFrame(frame, fps, audioSegments);

    if (!audioSegment) {
      return null;
    }

    const audioTime = (frame / fps) * 1000;
    const animationTiming = calculateAnimationTiming(audioSegment, fps);

    // Find the corresponding text
    const { sections } = prepareCapsuleForTTS(capsuleData);
    let segmentIndex = 0;
    let currentText = '';

    for (let i = 0; i < sections.length; i++) {
      currentText += sections[i].content + ' ';
      if (currentText.includes(audioSegment.text)) {
        segmentIndex = i;
        break;
      }
    }

    return {
      segmentIndex,
      frame,
      audioTime,
      text: audioSegment.text,
      animationTiming,
    };
  } catch (error) {
    console.error(`[Video TTS] Error getting audio sync for frame ${frame}:`, error);
    return null;
  }
}

/**
 * Validate video and audio synchronization
 */
export function validateVideoAudioSync(
  videoDuration: number,
  audioDuration: number,
  fps: number,
  audioSegments: TTSSegment[]
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check if audio duration is within reasonable range of video duration
  const durationDiff = Math.abs(videoDuration - audioDuration / 1000);
  const tolerance = 2; // 2 seconds tolerance

  if (durationDiff > tolerance) {
    issues.push(
      `Audio duration (${(audioDuration / 1000).toFixed(2)}s) differs significantly from video duration (${videoDuration.toFixed(2)}s)`
    );
  }

  // Check for gaps in audio segments
  for (let i = 0; i < audioSegments.length - 1; i++) {
    const gap = audioSegments[i + 1].startTime - audioSegments[i].endTime;
    if (gap > 1000) {
      // More than 1 second gap
      issues.push(
        `Large gap between segment ${i} and ${i + 1}: ${(gap / 1000).toFixed(2)}s`
      );
    }
  }

  // Check if last segment ends before video ends
  if (audioSegments.length > 0) {
    const lastSegmentEnd = audioSegments[audioSegments.length - 1].endTime / 1000;
    if (lastSegmentEnd < videoDuration - 1) {
      issues.push(
        `Audio ends before video (${lastSegmentEnd.toFixed(2)}s vs ${videoDuration.toFixed(2)}s)`
      );
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Calculate optimal audio offset for video
 */
export function calculateOptimalAudioOffset(
  videoDuration: number,
  audioDuration: number,
  audioSegments: TTSSegment[]
): number {
  // Default: start audio at beginning
  let offset = 0;

  // If audio is shorter than video, add padding at the end
  const durationDiff = (videoDuration * 1000 - audioDuration) / 2;

  if (durationDiff > 0) {
    // Center the audio in the video
    offset = durationDiff;
  }

  return Math.max(0, offset);
}

/**
 * Prepare complete video with audio
 */
export async function prepareVideoWithAudio(
  config: VideoWithAudioConfig
): Promise<VideoAudioResult> {
  try {
    console.log('[Video TTS] Preparing video with audio');

    // Generate audio
    console.log('[Video TTS] Step 1: Generating audio');
    const audioResult = await generateCapsuleAudio(config.capsuleData, config.ttsConfig);

    // Create sync markers
    console.log('[Video TTS] Step 2: Creating sync markers');
    const syncMarkers = createVideoSyncMarkers(audioResult.segments, config.fps);

    // Validate sync
    console.log('[Video TTS] Step 3: Validating synchronization');
    const syncValidation = validateVideoAudioSync(
      config.videoDuration,
      audioResult.duration * 1000,
      config.fps,
      audioResult.segments
    );

    if (!syncValidation.valid) {
      console.warn('[Video TTS] Sync validation issues:', syncValidation.issues);
    }

    // Calculate optimal offset
    const audioOffset = calculateOptimalAudioOffset(
      config.videoDuration,
      audioResult.duration * 1000,
      audioResult.segments
    );

    console.log('[Video TTS] Audio offset:', audioOffset, 'ms');

    // Upload audio to storage
    console.log('[Video TTS] Step 4: Uploading audio to storage');
    const audioKey = `audio/narration-${Date.now()}.${config.ttsConfig.audioFormat || 'mp3'}`;

    // In production, would upload actual audio buffer
    const { url: audioUrl } = await storagePut(
      audioKey,
      Buffer.from('audio-placeholder'),
      `audio/${config.ttsConfig.audioFormat || 'mp3'}`
    );

    console.log('[Video TTS] Audio uploaded:', audioUrl);

    return {
      success: true,
      audioUrl,
      syncMarkers,
      audioSegments: audioResult.segments,
      totalDuration: config.videoDuration,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Video TTS] Video with audio preparation failed: ${errorMessage}`);

    return {
      success: false,
      syncMarkers: [],
      audioSegments: [],
      totalDuration: 0,
      error: errorMessage,
    };
  }
}

/**
 * Format audio sync information for logging
 */
export function formatAudioSyncInfo(syncInfo: AudioSyncInfo): string {
  return `
    Segment: ${syncInfo.segmentIndex}
    Frame: ${syncInfo.frame}
    Audio Time: ${(syncInfo.audioTime / 1000).toFixed(2)}s
    Text: "${syncInfo.text.substring(0, 50)}..."
    Animation: ${syncInfo.animationTiming.startFrame}-${syncInfo.animationTiming.endFrame} (${syncInfo.animationTiming.duration.toFixed(2)}s)
  `;
}

/**
 * Get statistics about audio and video
 */
export function getAudioVideoStats(
  videoDuration: number,
  audioSegments: TTSSegment[],
  fps: number
): {
  videoDuration: number;
  audioDuration: number;
  totalFrames: number;
  segmentCount: number;
  avgSegmentDuration: number;
  avgSegmentFrames: number;
} {
  const audioDuration = audioSegments.length > 0
    ? audioSegments[audioSegments.length - 1].endTime / 1000
    : 0;

  const totalFrames = Math.ceil(videoDuration * fps);
  const avgSegmentDuration =
    audioSegments.length > 0
      ? audioSegments.reduce((sum, s) => sum + s.duration, 0) / audioSegments.length / 1000
      : 0;
  const avgSegmentFrames = avgSegmentDuration * fps;

  return {
    videoDuration,
    audioDuration,
    totalFrames,
    segmentCount: audioSegments.length,
    avgSegmentDuration,
    avgSegmentFrames,
  };
}
