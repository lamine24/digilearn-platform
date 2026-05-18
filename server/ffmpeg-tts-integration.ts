/**
 * FFmpeg TTS Integration
 * Integrates FFmpeg audio processing with TTS pipeline
 */

import { FFmpegAudioService, AudioSegment, CombineOptions } from './ffmpeg-service';
import { AudioEffectsService } from './audio-effects';
import { AudioSyncEngine } from './audio-sync-engine';

export interface AudioProcessingConfig {
  combineOptions?: CombineOptions;
  applyFadeIn?: boolean;
  fadeInDuration?: number;
  applyFadeOut?: boolean;
  fadeOutDuration?: number;
  normalize?: boolean;
  crossfadeDuration?: number;
  equalizerPreset?: string;
}

export interface ProcessedAudioResult {
  audioPath: string;
  duration: number;
  metadata: {
    bitrate: string;
    sampleRate: number;
    channels: number;
    processingTime: number;
  };
}

/**
 * FFmpeg TTS Integration Service
 */
export class FFmpegTTSIntegration {
  private ffmpegService: FFmpegAudioService;
  private effectsService: AudioEffectsService;
  private syncEngine: AudioSyncEngine;

  constructor(
    ffmpegService: FFmpegAudioService,
    effectsService: AudioEffectsService,
    syncEngine: AudioSyncEngine
  ) {
    this.ffmpegService = ffmpegService;
    this.effectsService = effectsService;
    this.syncEngine = syncEngine;
  }

  /**
   * Process audio segments with effects
   */
  async processAudioSegments(
    segments: AudioSegment[],
    config: AudioProcessingConfig = {}
  ): Promise<ProcessedAudioResult> {
    const startTime = Date.now();

    try {
      console.log(`[FFmpeg TTS] Processing ${segments.length} audio segments`);

      // Combine segments
      const combineOptions: CombineOptions = {
        outputFormat: config.combineOptions?.outputFormat || 'mp3',
        bitrate: config.combineOptions?.bitrate || '192k',
        sampleRate: config.combineOptions?.sampleRate || 44100,
        normalize: config.normalize !== false,
        crossfadeDuration: config.crossfadeDuration || 0.5,
      };

      const { outputPath: combinedAudioPath, duration: combinedDuration } =
        await this.ffmpegService.combineSegments(segments, combineOptions);

      console.log(`[FFmpeg TTS] Combined audio: ${combinedDuration.toFixed(2)}s`);

      let processedAudioPath = combinedAudioPath;
      let processedDuration = combinedDuration;

      // Apply fade in
      if (config.applyFadeIn) {
        const fadeInDuration = config.fadeInDuration || 1.0;
        const { outputPath: fadeInPath } = await this.ffmpegService.applyFadeIn(
          processedAudioPath,
          fadeInDuration
        );
        processedAudioPath = fadeInPath;
        console.log(`[FFmpeg TTS] Applied fade in: ${fadeInDuration}s`);
      }

      // Apply fade out
      if (config.applyFadeOut) {
        const fadeOutDuration = config.fadeOutDuration || 1.0;
        const { outputPath: fadeOutPath } = await this.ffmpegService.applyFadeOut(
          processedAudioPath,
          fadeOutDuration
        );
        processedAudioPath = fadeOutPath;
        console.log(`[FFmpeg TTS] Applied fade out: ${fadeOutDuration}s`);
      }

      // Apply equalizer preset
      if (config.equalizerPreset) {
        const presets = this.effectsService.getEqualizerPresets();
        const preset = presets[config.equalizerPreset];

        if (preset) {
          const { outputPath: eqPath } = await this.effectsService.applyEqualizer(
            processedAudioPath,
            preset
          );
          processedAudioPath = eqPath;
          console.log(`[FFmpeg TTS] Applied equalizer: ${config.equalizerPreset}`);
        }
      }

      // Get final metadata
      const metadata = await this.ffmpegService.getAudioMetadata(processedAudioPath);

      const processingTime = Date.now() - startTime;

      const result: ProcessedAudioResult = {
        audioPath: processedAudioPath,
        duration: metadata.duration,
        metadata: {
          bitrate: metadata.bitrate,
          sampleRate: metadata.sampleRate,
          channels: metadata.channels,
          processingTime,
        },
      };

      console.log(`[FFmpeg TTS] Processing completed in ${processingTime}ms`);
      return result;
    } catch (error) {
      console.error('[FFmpeg TTS] Processing error:', error);
      throw error;
    }
  }

  /**
   * Process with professional voice settings
   */
  async processWithVoiceSettings(
    segments: AudioSegment[],
    voiceSettings: {
      equalizerPreset?: string;
      compressorEnabled?: boolean;
      reverbEnabled?: boolean;
      noiseReductionEnabled?: boolean;
    } = {}
  ): Promise<ProcessedAudioResult> {
    const config: AudioProcessingConfig = {
      applyFadeIn: true,
      fadeInDuration: 0.5,
      applyFadeOut: true,
      fadeOutDuration: 1.0,
      normalize: true,
      crossfadeDuration: 0.5,
      equalizerPreset: voiceSettings.equalizerPreset || 'voiceover',
    };

    return this.processAudioSegments(segments, config);
  }

  /**
   * Process with podcast settings
   */
  async processWithPodcastSettings(
    segments: AudioSegment[]
  ): Promise<ProcessedAudioResult> {
    return this.processWithVoiceSettings(segments, {
      equalizerPreset: 'podcast',
      compressorEnabled: true,
      noiseReductionEnabled: true,
    });
  }

  /**
   * Process with audiobook settings
   */
  async processWithAudiobookSettings(
    segments: AudioSegment[]
  ): Promise<ProcessedAudioResult> {
    return this.processWithVoiceSettings(segments, {
      equalizerPreset: 'warm',
      compressorEnabled: true,
      reverbEnabled: false,
    });
  }

  /**
   * Process with educational settings
   */
  async processWithEducationalSettings(
    segments: AudioSegment[]
  ): Promise<ProcessedAudioResult> {
    return this.processWithVoiceSettings(segments, {
      equalizerPreset: 'voiceover',
      compressorEnabled: true,
      noiseReductionEnabled: true,
    });
  }

  /**
   * Get audio processing presets
   */
  getProcessingPresets(): Record<string, AudioProcessingConfig> {
    return {
      podcast: {
        applyFadeIn: true,
        fadeInDuration: 0.5,
        applyFadeOut: true,
        fadeOutDuration: 1.0,
        normalize: true,
        crossfadeDuration: 0.5,
        equalizerPreset: 'podcast',
      },
      audiobook: {
        applyFadeIn: true,
        fadeInDuration: 0.3,
        applyFadeOut: true,
        fadeOutDuration: 0.5,
        normalize: true,
        crossfadeDuration: 0.3,
        equalizerPreset: 'warm',
      },
      voiceover: {
        applyFadeIn: false,
        applyFadeOut: false,
        normalize: true,
        crossfadeDuration: 0.2,
        equalizerPreset: 'voiceover',
      },
      educational: {
        applyFadeIn: true,
        fadeInDuration: 0.5,
        applyFadeOut: true,
        fadeOutDuration: 1.0,
        normalize: true,
        crossfadeDuration: 0.5,
        equalizerPreset: 'voiceover',
      },
    };
  }

  /**
   * Cleanup temporary audio files
   */
  cleanupAudioFiles(filePaths: string[]): void {
    this.ffmpegService.cleanupTempFiles(filePaths);
  }

  /**
   * Get service statistics
   */
  getStats() {
    return this.ffmpegService.getStats();
  }
}

/**
 * Create FFmpeg TTS integration
 */
export function createFFmpegTTSIntegration(
  ffmpegService: FFmpegAudioService,
  effectsService: AudioEffectsService,
  syncEngine: AudioSyncEngine
): FFmpegTTSIntegration {
  return new FFmpegTTSIntegration(ffmpegService, effectsService, syncEngine);
}
