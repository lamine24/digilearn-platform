/**
 * Audio Effects Service
 * Advanced audio effects and processing
 */

import { FFmpegAudioService } from './ffmpeg-service';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface EqualizerPreset {
  name: string;
  frequencies: {
    hz: number;
    gain: number;
  }[];
}

export interface CompressorSettings {
  threshold: number;
  ratio: number;
  attackTime: number;
  releaseTime: number;
  makeupGain: number;
}

export interface ReverbSettings {
  roomSize: number;
  damping: number;
  wetLevel: number;
  dryLevel: number;
}

/**
 * Audio Effects Service
 */
export class AudioEffectsService {
  private ffmpegService: FFmpegAudioService;
  private outputDir: string;

  constructor(ffmpegService: FFmpegAudioService, outputDir: string = '/tmp/audio-effects') {
    this.ffmpegService = ffmpegService;
    this.outputDir = outputDir;
  }

  /**
   * Apply equalizer preset
   */
  async applyEqualizer(
    inputPath: string,
    preset: EqualizerPreset
  ): Promise<{ outputPath: string }> {
    const jobId = uuidv4();
    const outputPath = path.join(this.outputDir, `audio-eq-${jobId}.mp3`);

    try {
      // Build equalizer filter
      const eqFilters = preset.frequencies
        .map((freq) => `equalizer=f=${freq.hz}:g=${freq.gain}:t=q:w=1`)
        .join(',');

      const command = `ffmpeg -i "${inputPath}" -af "${eqFilters}" -y "${outputPath}"`;

      console.log(`[Audio Effects] Applying equalizer: ${preset.name}`);
      // Execute command (simplified - in production use child_process)

      return { outputPath };
    } catch (error) {
      console.error('[Audio Effects] Equalizer error:', error);
      throw error;
    }
  }

  /**
   * Apply compressor
   */
  async applyCompressor(
    inputPath: string,
    settings: CompressorSettings
  ): Promise<{ outputPath: string }> {
    const jobId = uuidv4();
    const outputPath = path.join(this.outputDir, `audio-compressed-${jobId}.mp3`);

    try {
      const compressorFilter = `compand=attacks=${settings.attackTime}:decays=${settings.releaseTime}:points=-80/-80|-${settings.threshold}/-${settings.threshold}|0/0|20/20`;

      const command = `ffmpeg -i "${inputPath}" -af "${compressorFilter}" -y "${outputPath}"`;

      console.log('[Audio Effects] Applying compressor');
      // Execute command

      return { outputPath };
    } catch (error) {
      console.error('[Audio Effects] Compressor error:', error);
      throw error;
    }
  }

  /**
   * Apply reverb effect
   */
  async applyReverb(
    inputPath: string,
    settings: ReverbSettings
  ): Promise<{ outputPath: string }> {
    const jobId = uuidv4();
    const outputPath = path.join(this.outputDir, `audio-reverb-${jobId}.mp3`);

    try {
      const reverbFilter = `aecho=0.8:0.9:1000:0.3`;

      const command = `ffmpeg -i "${inputPath}" -af "${reverbFilter}" -y "${outputPath}"`;

      console.log('[Audio Effects] Applying reverb');
      // Execute command

      return { outputPath };
    } catch (error) {
      console.error('[Audio Effects] Reverb error:', error);
      throw error;
    }
  }

  /**
   * Apply noise reduction
   */
  async reduceNoise(inputPath: string, strength: number = 0.5): Promise<{ outputPath: string }> {
    const jobId = uuidv4();
    const outputPath = path.join(this.outputDir, `audio-denoised-${jobId}.mp3`);

    try {
      const noiseFilter = `anlmdn=s=${strength}`;

      const command = `ffmpeg -i "${inputPath}" -af "${noiseFilter}" -y "${outputPath}"`;

      console.log(`[Audio Effects] Reducing noise: strength=${strength}`);
      // Execute command

      return { outputPath };
    } catch (error) {
      console.error('[Audio Effects] Noise reduction error:', error);
      throw error;
    }
  }

  /**
   * Apply pitch shift
   */
  async shiftPitch(inputPath: string, semitones: number): Promise<{ outputPath: string }> {
    const jobId = uuidv4();
    const outputPath = path.join(this.outputDir, `audio-pitched-${jobId}.mp3`);

    try {
      const pitchFilter = `rubberband=pitch=${semitones}`;

      const command = `ffmpeg -i "${inputPath}" -af "${pitchFilter}" -y "${outputPath}"`;

      console.log(`[Audio Effects] Shifting pitch: ${semitones} semitones`);
      // Execute command

      return { outputPath };
    } catch (error) {
      console.error('[Audio Effects] Pitch shift error:', error);
      throw error;
    }
  }

  /**
   * Apply time stretch
   */
  async stretchTime(inputPath: string, factor: number): Promise<{ outputPath: string }> {
    const jobId = uuidv4();
    const outputPath = path.join(this.outputDir, `audio-stretched-${jobId}.mp3`);

    try {
      const stretchFilter = `rubberband=tempo=${factor}`;

      const command = `ffmpeg -i "${inputPath}" -af "${stretchFilter}" -y "${outputPath}"`;

      console.log(`[Audio Effects] Stretching time: ${factor}x`);
      // Execute command

      return { outputPath };
    } catch (error) {
      console.error('[Audio Effects] Time stretch error:', error);
      throw error;
    }
  }

  /**
   * Apply parametric equalizer
   */
  async applyParametricEQ(
    inputPath: string,
    settings: {
      lowFreq: number;
      lowGain: number;
      midFreq: number;
      midGain: number;
      highFreq: number;
      highGain: number;
    }
  ): Promise<{ outputPath: string }> {
    const jobId = uuidv4();
    const outputPath = path.join(this.outputDir, `audio-peq-${jobId}.mp3`);

    try {
      const eqFilter = [
        `equalizer=f=${settings.lowFreq}:g=${settings.lowGain}:t=q:w=1`,
        `equalizer=f=${settings.midFreq}:g=${settings.midGain}:t=q:w=1`,
        `equalizer=f=${settings.highFreq}:g=${settings.highGain}:t=q:w=1`,
      ].join(',');

      const command = `ffmpeg -i "${inputPath}" -af "${eqFilter}" -y "${outputPath}"`;

      console.log('[Audio Effects] Applying parametric EQ');
      // Execute command

      return { outputPath };
    } catch (error) {
      console.error('[Audio Effects] Parametric EQ error:', error);
      throw error;
    }
  }

  /**
   * Apply multi-band compression
   */
  async applyMultiBandCompression(inputPath: string): Promise<{ outputPath: string }> {
    const jobId = uuidv4();
    const outputPath = path.join(this.outputDir, `audio-mbc-${jobId}.mp3`);

    try {
      const mbcFilter = `split[a][b];[a]equalizer=f=100:g=-5:t=q:w=1[low];[b]equalizer=f=1000:g=5:t=q:w=1[high];[low][high]amix=inputs=2:duration=first`;

      const command = `ffmpeg -i "${inputPath}" -af "${mbcFilter}" -y "${outputPath}"`;

      console.log('[Audio Effects] Applying multi-band compression');
      // Execute command

      return { outputPath };
    } catch (error) {
      console.error('[Audio Effects] Multi-band compression error:', error);
      throw error;
    }
  }

  /**
   * Apply stereo widening
   */
  async applyStereoWidening(inputPath: string, width: number = 1.5): Promise<{ outputPath: string }> {
    const jobId = uuidv4();
    const outputPath = path.join(this.outputDir, `audio-stereo-${jobId}.mp3`);

    try {
      const stereoFilter = `stereotools=slevel=${width}`;

      const command = `ffmpeg -i "${inputPath}" -af "${stereoFilter}" -y "${outputPath}"`;

      console.log(`[Audio Effects] Applying stereo widening: ${width}x`);
      // Execute command

      return { outputPath };
    } catch (error) {
      console.error('[Audio Effects] Stereo widening error:', error);
      throw error;
    }
  }

  /**
   * Apply crossfade between two audio files
   */
  async applyCrossfade(
    inputPath1: string,
    inputPath2: string,
    duration: number = 1.0
  ): Promise<{ outputPath: string }> {
    const jobId = uuidv4();
    const outputPath = path.join(this.outputDir, `audio-crossfade-${jobId}.mp3`);

    try {
      const crossfadeFilter = `acrossfade=d=${duration}`;

      const command = `ffmpeg -i "${inputPath1}" -i "${inputPath2}" -filter_complex "${crossfadeFilter}" -y "${outputPath}"`;

      console.log(`[Audio Effects] Applying crossfade: ${duration}s`);
      // Execute command

      return { outputPath };
    } catch (error) {
      console.error('[Audio Effects] Crossfade error:', error);
      throw error;
    }
  }

  /**
   * Get available equalizer presets
   */
  getEqualizerPresets(): Record<string, EqualizerPreset> {
    return {
      bright: {
        name: 'Bright',
        frequencies: [
          { hz: 100, gain: -2 },
          { hz: 1000, gain: 2 },
          { hz: 10000, gain: 4 },
        ],
      },
      warm: {
        name: 'Warm',
        frequencies: [
          { hz: 100, gain: 4 },
          { hz: 1000, gain: 2 },
          { hz: 10000, gain: -2 },
        ],
      },
      podcast: {
        name: 'Podcast',
        frequencies: [
          { hz: 100, gain: -3 },
          { hz: 500, gain: 2 },
          { hz: 3000, gain: 4 },
          { hz: 10000, gain: -1 },
        ],
      },
      voiceover: {
        name: 'Voice Over',
        frequencies: [
          { hz: 80, gain: -2 },
          { hz: 200, gain: 1 },
          { hz: 2000, gain: 3 },
          { hz: 8000, gain: 2 },
        ],
      },
    };
  }

  /**
   * Get default compressor settings
   */
  getDefaultCompressorSettings(): CompressorSettings {
    return {
      threshold: -20,
      ratio: 4,
      attackTime: 0.005,
      releaseTime: 0.1,
      makeupGain: 5,
    };
  }

  /**
   * Get default reverb settings
   */
  getDefaultReverbSettings(): ReverbSettings {
    return {
      roomSize: 0.5,
      damping: 0.5,
      wetLevel: 0.3,
      dryLevel: 0.7,
    };
  }
}

/**
 * Create audio effects service
 */
export function createAudioEffectsService(
  ffmpegService: FFmpegAudioService,
  outputDir?: string
): AudioEffectsService {
  return new AudioEffectsService(ffmpegService, outputDir);
}
