/**
 * Remotion Render Service
 * Server-side rendering service for capsule videos using Remotion
 */

import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { CapsuleData } from './video-generation';
import {
  validateCapsuleData,
  estimateCapsuleDuration,
} from './remotion-renderer';

const execAsync = promisify(exec);

export interface RenderOptions {
  outputPath: string;
  codec?: 'h264' | 'h265' | 'vp8' | 'vp9';
  quality?: 'low' | 'medium' | 'high';
  fps?: number;
  width?: number;
  height?: number;
}

export interface RenderResult {
  success: boolean;
  videoPath?: string;
  duration: number;
  fileSize: number;
  error?: string;
}

/**
 * Calculate Remotion render settings based on quality
 */
function getRenderSettings(quality: 'low' | 'medium' | 'high' = 'medium') {
  const settings = {
    low: {
      codec: 'h264' as const,
      crf: 28, // Lower quality, smaller file size
      preset: 'fast',
    },
    medium: {
      codec: 'h264' as const,
      crf: 23, // Balanced quality and file size
      preset: 'medium',
    },
    high: {
      codec: 'h264' as const,
      crf: 18, // Higher quality, larger file size
      preset: 'slow',
    },
  };

  return settings[quality];
}

/**
 * Generate Remotion config file for rendering
 */
function generateRemotionConfig(
  capsuleData: CapsuleData,
  durationInFrames: number,
  fps: number,
  outputPath: string,
  options: RenderOptions
): string {
  const configPath = path.join(process.cwd(), 'remotion-config.json');

  const config = {
    composition: 'CapsuleComposition',
    fps: options.fps || fps,
    width: options.width || 1920,
    height: options.height || 1080,
    durationInFrames,
    codec: options.codec || 'h264',
    quality: options.quality || 'medium',
    outputPath,
    data: capsuleData,
  };

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  return configPath;
}

/**
 * Render capsule video using Remotion
 */
export async function renderCapsuleVideo(
  capsuleData: CapsuleData,
  options: RenderOptions
): Promise<RenderResult> {
  try {
    // Validate capsule data
    const validation = validateCapsuleData(capsuleData);
    if (!validation.valid) {
      return {
        success: false,
        duration: 0,
        fileSize: 0,
        error: `Validation failed: ${validation.errors.join(', ')}`,
      };
    }

    // Estimate duration
    const estimatedDurationSeconds = estimateCapsuleDuration(capsuleData);
    const fps = options.fps || 30;
    const durationInFrames = Math.ceil(estimatedDurationSeconds * fps);

    // Ensure output directory exists
    const outputDir = path.dirname(options.outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate config
    const configPath = generateRemotionConfig(
      capsuleData,
      durationInFrames,
      fps,
      options.outputPath,
      options
    );

    // Build Remotion render command
    const renderSettings = getRenderSettings(options.quality);
    const command = buildRenderCommand(
      configPath,
      options.outputPath,
      renderSettings,
      options
    );

    console.log(`[Remotion] Starting render: ${command}`);

    // Execute render command
    const { stdout, stderr } = await execAsync(command, {
      timeout: 3600000, // 1 hour timeout
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    if (stderr && !stderr.includes('Warning')) {
      console.warn(`[Remotion] Warnings: ${stderr}`);
    }

    console.log(`[Remotion] Render completed: ${stdout}`);

    // Verify output file exists
    if (!fs.existsSync(options.outputPath)) {
      throw new Error('Output file was not created');
    }

    // Get file size
    const stats = fs.statSync(options.outputPath);
    const fileSize = stats.size;

    // Clean up config file
    fs.unlinkSync(configPath);

    return {
      success: true,
      videoPath: options.outputPath,
      duration: estimatedDurationSeconds,
      fileSize,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Remotion] Render failed: ${errorMessage}`);

    // Clean up partial output if exists
    try {
      if (fs.existsSync(options.outputPath)) {
        fs.unlinkSync(options.outputPath);
      }
    } catch (cleanupError) {
      console.warn(`[Remotion] Failed to clean up partial output: ${cleanupError}`);
    }

    return {
      success: false,
      duration: 0,
      fileSize: 0,
      error: errorMessage,
    };
  }
}

/**
 * Build Remotion render command
 */
function buildRenderCommand(
  configPath: string,
  outputPath: string,
  renderSettings: ReturnType<typeof getRenderSettings>,
  options: RenderOptions
): string {
  const commands = [
    'npx remotion render',
    `--config ${configPath}`,
    `--codec ${renderSettings.codec}`,
    `--crf ${renderSettings.crf}`,
    `--preset ${renderSettings.preset}`,
    `--fps ${options.fps || 30}`,
    `--width ${options.width || 1920}`,
    `--height ${options.height || 1080}`,
    `--output ${outputPath}`,
    'CapsuleComposition',
  ];

  return commands.join(' ');
}

/**
 * Get video metadata
 */
export async function getVideoMetadata(videoPath: string) {
  try {
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file not found: ${videoPath}`);
    }

    const stats = fs.statSync(videoPath);

    // Try to get duration using ffprobe if available
    let duration = 0;
    try {
      const { stdout } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1:noprint_wrappers=1 "${videoPath}"`
      );
      duration = parseFloat(stdout.trim());
    } catch (error) {
      console.warn('[Remotion] Could not get video duration from ffprobe');
    }

    return {
      path: videoPath,
      size: stats.size,
      duration,
      created: stats.birthtime,
      modified: stats.mtime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get video metadata: ${errorMessage}`);
  }
}

/**
 * Delete video file
 */
export async function deleteVideo(videoPath: string): Promise<boolean> {
  try {
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
      console.log(`[Remotion] Deleted video: ${videoPath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`[Remotion] Failed to delete video: ${error}`);
    return false;
  }
}

/**
 * Estimate render time based on video duration and quality
 */
export function estimateRenderTime(
  videoDurationSeconds: number,
  quality: 'low' | 'medium' | 'high' = 'medium'
): number {
  // Rough estimates based on typical hardware
  const multipliers = {
    low: 0.5, // 0.5x real-time
    medium: 1, // 1x real-time
    high: 2, // 2x real-time
  };

  const multiplier = multipliers[quality];
  return Math.ceil(videoDurationSeconds * multiplier);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate render environment
 */
export async function validateRenderEnvironment(): Promise<{
  valid: boolean;
  issues: string[];
}> {
  const issues: string[] = [];

  // Check Node.js
  try {
    const { stdout } = await execAsync('node --version');
    console.log(`[Remotion] Node.js version: ${stdout.trim()}`);
  } catch (error) {
    issues.push('Node.js is not installed');
  }

  // Check npm/pnpm
  try {
    await execAsync('npm --version');
  } catch (error) {
    try {
      await execAsync('pnpm --version');
    } catch (pnpmError) {
      issues.push('npm or pnpm is not installed');
    }
  }

  // Check ffmpeg
  try {
    const { stdout } = await execAsync('ffmpeg -version');
    console.log(`[Remotion] ffmpeg is available`);
  } catch (error) {
    issues.push('ffmpeg is not installed');
  }

  // Check ffprobe
  try {
    await execAsync('ffprobe -version');
    console.log(`[Remotion] ffprobe is available`);
  } catch (error) {
    issues.push('ffprobe is not installed');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
