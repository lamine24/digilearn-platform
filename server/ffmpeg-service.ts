/**
 * FFmpeg Audio Service
 * Combines audio segments with professional effects using FFmpeg
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

export interface AudioSegment {
  filePath: string;
  duration: number;
  fadeIn?: number;
  fadeOut?: number;
  volume?: number;
}

export interface CombineOptions {
  outputFormat?: 'mp3' | 'wav' | 'aac' | 'ogg';
  bitrate?: string;
  sampleRate?: number;
  normalize?: boolean;
  crossfadeDuration?: number;
}

export interface AudioEffect {
  type: 'fadeIn' | 'fadeOut' | 'crossfade' | 'normalize' | 'volume';
  duration?: number;
  volume?: number;
  startTime?: number;
}

/**
 * FFmpeg Audio Service
 */
export class FFmpegAudioService {
  private tempDir: string;
  private outputDir: string;
  private ffmpegPath: string;

  constructor(tempDir?: string, outputDir?: string, ffmpegPath: string = 'ffmpeg') {
    this.tempDir = tempDir || '/tmp/ffmpeg-audio';
    this.outputDir = outputDir || '/tmp/ffmpeg-output';
    this.ffmpegPath = ffmpegPath;

    this.ensureDirectories();
    this.verifyFFmpeg();
  }

  /**
   * Ensure directories exist
   */
  private ensureDirectories(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Verify FFmpeg is installed
   */
  private async verifyFFmpeg(): Promise<void> {
    try {
      await execAsync(`${this.ffmpegPath} -version`);
      console.log('[FFmpeg] FFmpeg is available');
    } catch (error) {
      console.warn('[FFmpeg] FFmpeg not found. Install with: apt-get install ffmpeg');
    }
  }

  /**
   * Combine audio segments
   */
  async combineSegments(
    segments: AudioSegment[],
    options: CombineOptions = {}
  ): Promise<{ outputPath: string; duration: number }> {
    if (segments.length === 0) {
      throw new Error('No audio segments provided');
    }

    const outputFormat = options.outputFormat || 'mp3';
    const bitrate = options.bitrate || '192k';
    const sampleRate = options.sampleRate || 44100;
    const normalize = options.normalize !== false;
    const crossfadeDuration = options.crossfadeDuration || 0.5;

    const jobId = uuidv4();
    const concatFile = path.join(this.tempDir, `concat-${jobId}.txt`);
    const outputPath = path.join(this.outputDir, `audio-${jobId}.${outputFormat}`);

    try {
      // Create concat demuxer file
      const concatContent = segments
        .map((seg) => `file '${seg.filePath}'`)
        .join('\n');

      fs.writeFileSync(concatFile, concatContent);
      console.log(`[FFmpeg] Created concat file: ${concatFile}`);

      // Build FFmpeg command
      let command = `${this.ffmpegPath} -f concat -safe 0 -i "${concatFile}"`;

      // Add audio filters
      const filters: string[] = [];

      // Add normalization
      if (normalize) {
        filters.push('loudnorm=I=-23:TP=-1.5:LRA=11');
      }

      // Add crossfade between segments
      if (segments.length > 1 && crossfadeDuration > 0) {
        filters.push(`acrossfade=d=${crossfadeDuration}`);
      }

      // Apply filters
      if (filters.length > 0) {
        command += ` -af "${filters.join(',')}"`;
      }

      // Add output options
      command += ` -b:a ${bitrate} -ar ${sampleRate} -y "${outputPath}"`;

      console.log(`[FFmpeg] Executing: ${command}`);

      // Execute FFmpeg
      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      console.log(`[FFmpeg] Combine completed: ${outputPath}`);

      // Get output duration
      const duration = await this.getAudioDuration(outputPath);

      return {
        outputPath,
        duration,
      };
    } catch (error) {
      console.error('[FFmpeg] Combine error:', error);
      throw error;
    } finally {
      // Cleanup concat file
      if (fs.existsSync(concatFile)) {
        fs.unlinkSync(concatFile);
      }
    }
  }

  /**
   * Apply fade in effect
   */
  async applyFadeIn(
    inputPath: string,
    duration: number = 1.0
  ): Promise<{ outputPath: string }> {
    const jobId = uuidv4();
    const outputPath = path.join(this.outputDir, `audio-fadein-${jobId}.mp3`);

    try {
      const command = `${this.ffmpegPath} -i "${inputPath}" -af "afade=t=in:st=0:d=${duration}" -y "${outputPath}"`;

      console.log(`[FFmpeg] Applying fade in: ${duration}s`);
      await execAsync(command);

      return { outputPath };
    } catch (error) {
      console.error('[FFmpeg] Fade in error:', error);
      throw error;
    }
  }

  /**
   * Apply fade out effect
   */
  async applyFadeOut(
    inputPath: string,
    duration: number = 1.0
  ): Promise<{ outputPath: string }> {
    const jobId = uuidv4();
    const outputPath = path.join(this.outputDir, `audio-fadeout-${jobId}.mp3`);

    try {
      const audioDuration = await this.getAudioDuration(inputPath);
      const startTime = Math.max(0, audioDuration - duration);

      const command = `${this.ffmpegPath} -i "${inputPath}" -af "afade=t=out:st=${startTime}:d=${duration}" -y "${outputPath}"`;

      console.log(`[FFmpeg] Applying fade out: ${duration}s at ${startTime}s`);
      await execAsync(command);

      return { outputPath };
    } catch (error) {
      console.error('[FFmpeg] Fade out error:', error);
      throw error;
    }
  }

  /**
   * Apply volume normalization
   */
  async normalizeVolume(inputPath: string): Promise<{ outputPath: string }> {
    const jobId = uuidv4();
    const outputPath = path.join(this.outputDir, `audio-normalized-${jobId}.mp3`);

    try {
      const command = `${this.ffmpegPath} -i "${inputPath}" -af "loudnorm=I=-23:TP=-1.5:LRA=11" -y "${outputPath}"`;

      console.log('[FFmpeg] Normalizing volume');
      await execAsync(command);

      return { outputPath };
    } catch (error) {
      console.error('[FFmpeg] Normalization error:', error);
      throw error;
    }
  }

  /**
   * Convert audio format
   */
  async convertFormat(
    inputPath: string,
    outputFormat: 'mp3' | 'wav' | 'aac' | 'ogg' = 'mp3',
    bitrate: string = '192k'
  ): Promise<{ outputPath: string }> {
    const jobId = uuidv4();
    const outputPath = path.join(this.outputDir, `audio-converted-${jobId}.${outputFormat}`);

    try {
      const command = `${this.ffmpegPath} -i "${inputPath}" -b:a ${bitrate} -y "${outputPath}"`;

      console.log(`[FFmpeg] Converting to ${outputFormat}`);
      await execAsync(command);

      return { outputPath };
    } catch (error) {
      console.error('[FFmpeg] Conversion error:', error);
      throw error;
    }
  }

  /**
   * Get audio duration
   */
  async getAudioDuration(filePath: string): Promise<number> {
    try {
      const command = `${this.ffmpegPath} -i "${filePath}" 2>&1 | grep Duration`;
      const { stdout } = await execAsync(command);

      const match = stdout.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
      if (match) {
        const hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const seconds = parseFloat(match[3]);
        return hours * 3600 + minutes * 60 + seconds;
      }

      return 0;
    } catch (error) {
      console.error('[FFmpeg] Duration error:', error);
      return 0;
    }
  }

  /**
   * Get audio metadata
   */
  async getAudioMetadata(filePath: string): Promise<{
    duration: number;
    bitrate: string;
    sampleRate: number;
    channels: number;
  }> {
    try {
      const command = `${this.ffmpegPath} -i "${filePath}" 2>&1`;
      const { stdout } = await execAsync(command);

      const durationMatch = stdout.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
      const bitrateMatch = stdout.match(/(\d+)\s*kb\/s/);
      const sampleRateMatch = stdout.match(/(\d+)\s*Hz/);
      const channelsMatch = stdout.match(/(mono|stereo|(\d+)\s*channels?)/);

      let duration = 0;
      if (durationMatch) {
        const hours = parseInt(durationMatch[1]);
        const minutes = parseInt(durationMatch[2]);
        const seconds = parseFloat(durationMatch[3]);
        duration = hours * 3600 + minutes * 60 + seconds;
      }

      return {
        duration,
        bitrate: bitrateMatch ? bitrateMatch[1] + 'k' : '192k',
        sampleRate: sampleRateMatch ? parseInt(sampleRateMatch[1]) : 44100,
        channels: channelsMatch ? (channelsMatch[1] === 'mono' ? 1 : 2) : 2,
      };
    } catch (error) {
      console.error('[FFmpeg] Metadata error:', error);
      return {
        duration: 0,
        bitrate: '192k',
        sampleRate: 44100,
        channels: 2,
      };
    }
  }

  /**
   * Cleanup temporary files
   */
  cleanupTempFiles(filePaths: string[]): void {
    for (const filePath of filePaths) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`[FFmpeg] Deleted: ${filePath}`);
        }
      } catch (error) {
        console.error(`[FFmpeg] Failed to delete: ${filePath}`, error);
      }
    }
  }

  /**
   * Get service statistics
   */
  getStats(): {
    tempDir: string;
    outputDir: string;
    tempFilesCount: number;
    outputFilesCount: number;
    tempDirSize: number;
    outputDirSize: number;
  } {
    const getTotalSize = (dir: string): number => {
      let size = 0;
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        size += stats.size;
      }
      return size;
    };

    return {
      tempDir: this.tempDir,
      outputDir: this.outputDir,
      tempFilesCount: fs.readdirSync(this.tempDir).length,
      outputFilesCount: fs.readdirSync(this.outputDir).length,
      tempDirSize: getTotalSize(this.tempDir),
      outputDirSize: getTotalSize(this.outputDir),
    };
  }
}

/**
 * Global FFmpeg service instance
 */
let globalFFmpegService: FFmpegAudioService | null = null;

/**
 * Initialize global FFmpeg service
 */
export function initializeFFmpegService(
  tempDir?: string,
  outputDir?: string
): FFmpegAudioService {
  if (!globalFFmpegService) {
    globalFFmpegService = new FFmpegAudioService(tempDir, outputDir);
  }
  return globalFFmpegService;
}

/**
 * Get global FFmpeg service
 */
export function getFFmpegService(): FFmpegAudioService {
  if (!globalFFmpegService) {
    throw new Error('FFmpeg service not initialized. Call initializeFFmpegService first.');
  }
  return globalFFmpegService;
}
