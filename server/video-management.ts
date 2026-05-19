/**
 * Video Management Service
 * Manage video files, downloads, and metadata
 */

import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface VideoMetadata {
  id: string;
  capsuleId: string;
  filename: string;
  fileSize: number;
  duration: number;
  resolution: string;
  bitrate: string;
  codec: string;
  createdAt: number;
  updatedAt: number;
  status: 'ready' | 'processing' | 'failed';
  error?: string;
  storageUrl: string;
  downloadUrl?: string;
}

/**
 * Video Management Service
 */
export class VideoManagementService {
  private videoDir: string;
  private metadataMap: Map<string, VideoMetadata> = new Map();

  constructor(videoDir: string = '/tmp/videos') {
    this.videoDir = videoDir;
    this.ensureDirectory();
  }

  /**
   * Ensure video directory exists
   */
  private ensureDirectory(): void {
    if (!fs.existsSync(this.videoDir)) {
      fs.mkdirSync(this.videoDir, { recursive: true });
      console.log(`[Video Management] Created directory: ${this.videoDir}`);
    }
  }

  /**
   * Register a video
   */
  registerVideo(
    capsuleId: string,
    filename: string,
    fileSize: number,
    metadata: Partial<VideoMetadata> = {}
  ): VideoMetadata {
    const videoId = uuidv4();
    const now = Date.now();

    const videoMetadata: VideoMetadata = {
      id: videoId,
      capsuleId,
      filename,
      fileSize,
      duration: metadata.duration || 0,
      resolution: metadata.resolution || '1080p',
      bitrate: metadata.bitrate || '192k',
      codec: metadata.codec || 'h264',
      createdAt: now,
      updatedAt: now,
      status: 'ready',
      storageUrl: `/manus-storage/${videoId}`,
      ...metadata,
    };

    this.metadataMap.set(videoId, videoMetadata);
    console.log(`[Video Management] Registered video: ${videoId}`);

    return videoMetadata;
  }

  /**
   * Get video metadata
   */
  getVideoMetadata(videoId: string): VideoMetadata | undefined {
    return this.metadataMap.get(videoId);
  }

  /**
   * Get videos by capsule
   */
  getVideosByCapsule(capsuleId: string): VideoMetadata[] {
    return Array.from(this.metadataMap.values()).filter(
      (v) => v.capsuleId === capsuleId
    );
  }

  /**
   * Update video metadata
   */
  updateVideoMetadata(videoId: string, updates: Partial<VideoMetadata>): VideoMetadata | undefined {
    const video = this.metadataMap.get(videoId);
    if (!video) return undefined;

    const updated = {
      ...video,
      ...updates,
      updatedAt: Date.now(),
    };

    this.metadataMap.set(videoId, updated);
    return updated;
  }

  /**
   * Generate download URL
   */
  generateDownloadUrl(videoId: string, expiresIn: number = 3600000): string {
    const video = this.metadataMap.get(videoId);
    if (!video) throw new Error('Video not found');

    const expiresAt = Date.now() + expiresIn;
    const token = Buffer.from(`${videoId}:${expiresAt}`).toString('base64');

    return `/api/videos/download/${token}`;
  }

  /**
   * Verify download token
   */
  verifyDownloadToken(token: string): { videoId: string; isValid: boolean } {
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [videoId, expiresAtStr] = decoded.split(':');
      const expiresAt = parseInt(expiresAtStr);

      const isValid = Date.now() < expiresAt && this.metadataMap.has(videoId);

      return { videoId, isValid };
    } catch (error) {
      return { videoId: '', isValid: false };
    }
  }

  /**
   * Get video file path
   */
  getVideoPath(videoId: string): string {
    const video = this.metadataMap.get(videoId);
    if (!video) throw new Error('Video not found');

    return path.join(this.videoDir, video.filename);
  }

  /**
   * Check if video exists
   */
  videoExists(videoId: string): boolean {
    const video = this.metadataMap.get(videoId);
    if (!video) return false;

    const filePath = this.getVideoPath(videoId);
    return fs.existsSync(filePath);
  }

  /**
   * Get video file stream
   */
  getVideoStream(videoId: string) {
    const filePath = this.getVideoPath(videoId);

    if (!fs.existsSync(filePath)) {
      throw new Error('Video file not found');
    }

    return fs.createReadStream(filePath);
  }

  /**
   * Delete video
   */
  deleteVideo(videoId: string): boolean {
    try {
      const filePath = this.getVideoPath(videoId);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      this.metadataMap.delete(videoId);
      console.log(`[Video Management] Deleted video: ${videoId}`);

      return true;
    } catch (error) {
      console.error(`[Video Management] Error deleting video: ${videoId}`, error);
      return false;
    }
  }

  /**
   * Get video statistics
   */
  getStatistics(): {
    totalVideos: number;
    totalSize: number;
    averageSize: number;
    readyVideos: number;
    processingVideos: number;
    failedVideos: number;
  } {
    const videos = Array.from(this.metadataMap.values());
    const totalSize = videos.reduce((sum, v) => sum + v.fileSize, 0);

    return {
      totalVideos: videos.length,
      totalSize,
      averageSize: videos.length > 0 ? totalSize / videos.length : 0,
      readyVideos: videos.filter((v) => v.status === 'ready').length,
      processingVideos: videos.filter((v) => v.status === 'processing').length,
      failedVideos: videos.filter((v) => v.status === 'failed').length,
    };
  }

  /**
   * Cleanup old videos
   */
  cleanupOldVideos(maxAge: number = 7 * 24 * 60 * 60 * 1000): { deletedCount: number; freedSpace: number } {
    const now = Date.now();
    let deletedCount = 0;
    let freedSpace = 0;

    const videosToDelete: string[] = [];

    for (const [videoId, video] of this.metadataMap.entries()) {
      if (now - video.createdAt > maxAge) {
        videosToDelete.push(videoId);
      }
    }

    for (const videoId of videosToDelete) {
      const video = this.metadataMap.get(videoId);
      if (video && this.deleteVideo(videoId)) {
        deletedCount++;
        freedSpace += video.fileSize;
      }
    }

    console.log(
      `[Video Management] Cleanup: deleted ${deletedCount} videos, freed ${(freedSpace / 1024 / 1024).toFixed(2)}MB`
    );

    return { deletedCount, freedSpace };
  }

  /**
   * List all videos
   */
  listVideos(capsuleId?: string): VideoMetadata[] {
    const videos = Array.from(this.metadataMap.values());

    if (capsuleId) {
      return videos.filter((v) => v.capsuleId === capsuleId);
    }

    return videos;
  }

  /**
   * Get video info
   */
  getVideoInfo(videoId: string): {
    metadata: VideoMetadata;
    exists: boolean;
    fileSize: number;
  } | null {
    const metadata = this.metadataMap.get(videoId);
    if (!metadata) return null;

    const filePath = this.getVideoPath(videoId);
    const exists = fs.existsSync(filePath);
    const fileSize = exists ? fs.statSync(filePath).size : 0;

    return {
      metadata,
      exists,
      fileSize,
    };
  }
}

/**
 * Global video management service instance
 */
let globalVideoService: VideoManagementService | null = null;

/**
 * Initialize global video service
 */
export function initializeVideoService(videoDir?: string): VideoManagementService {
  if (!globalVideoService) {
    globalVideoService = new VideoManagementService(videoDir);
  }
  return globalVideoService;
}

/**
 * Get global video service
 */
export function getVideoService(): VideoManagementService {
  if (!globalVideoService) {
    throw new Error('Video service not initialized. Call initializeVideoService first.');
  }
  return globalVideoService;
}
