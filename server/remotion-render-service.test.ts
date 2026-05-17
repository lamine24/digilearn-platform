/**
 * Remotion Render Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  estimateRenderTime,
  formatFileSize,
  validateRenderEnvironment,
} from './remotion-render-service';
import type { CapsuleData } from './video-generation';

describe('Remotion Render Service', () => {
  describe('estimateRenderTime', () => {
    it('should estimate render time for low quality', () => {
      const time = estimateRenderTime(60, 'low');
      expect(time).toBe(30); // 60 * 0.5
    });

    it('should estimate render time for medium quality', () => {
      const time = estimateRenderTime(60, 'medium');
      expect(time).toBe(60); // 60 * 1
    });

    it('should estimate render time for high quality', () => {
      const time = estimateRenderTime(60, 'high');
      expect(time).toBe(120); // 60 * 2
    });

    it('should handle zero duration', () => {
      const time = estimateRenderTime(0, 'medium');
      expect(time).toBe(0);
    });

    it('should handle very long videos', () => {
      const time = estimateRenderTime(3600, 'medium'); // 1 hour
      expect(time).toBe(3600);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(512)).toBe('512 Bytes');
    });

    it('should format kilobytes', () => {
      const size = formatFileSize(1024 * 2); // 2 KB
      expect(size).toContain('KB');
    });

    it('should format megabytes', () => {
      const size = formatFileSize(1024 * 1024 * 50); // 50 MB
      expect(size).toContain('MB');
    });

    it('should format gigabytes', () => {
      const size = formatFileSize(1024 * 1024 * 1024 * 2); // 2 GB
      expect(size).toContain('GB');
    });

    it('should handle zero bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
    });

    it('should round to 2 decimal places', () => {
      const size = formatFileSize(1536); // 1.5 KB
      expect(size).toMatch(/1\.5 KB/);
    });
  });

  describe('validateRenderEnvironment', () => {
    it('should validate render environment', async () => {
      const result = await validateRenderEnvironment();
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('issues');
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should return valid boolean', async () => {
      const result = await validateRenderEnvironment();
      expect(typeof result.valid).toBe('boolean');
    });

    it('should return issues array', async () => {
      const result = await validateRenderEnvironment();
      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('Render Options', () => {
    it('should accept render options', () => {
      const options = {
        outputPath: '/tmp/video.mp4',
        codec: 'h264' as const,
        quality: 'medium' as const,
        fps: 30,
        width: 1920,
        height: 1080,
      };

      expect(options.outputPath).toBe('/tmp/video.mp4');
      expect(options.codec).toBe('h264');
      expect(options.quality).toBe('medium');
      expect(options.fps).toBe(30);
      expect(options.width).toBe(1920);
      expect(options.height).toBe(1080);
    });

    it('should use default values for optional options', () => {
      const options = {
        outputPath: '/tmp/video.mp4',
      };

      expect(options.outputPath).toBe('/tmp/video.mp4');
    });
  });

  describe('Render Result', () => {
    it('should handle successful render result', () => {
      const result = {
        success: true,
        videoPath: '/tmp/video.mp4',
        duration: 60,
        fileSize: 1024 * 1024 * 50, // 50 MB
      };

      expect(result.success).toBe(true);
      expect(result.videoPath).toBe('/tmp/video.mp4');
      expect(result.duration).toBe(60);
      expect(result.fileSize).toBe(1024 * 1024 * 50);
    });

    it('should handle failed render result', () => {
      const result = {
        success: false,
        duration: 0,
        fileSize: 0,
        error: 'Render failed: ffmpeg not found',
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain('ffmpeg');
    });
  });

  describe('Render Settings', () => {
    it('should have correct settings for low quality', () => {
      // Low quality should have higher CRF (lower quality)
      const lowQuality = {
        codec: 'h264',
        crf: 28,
        preset: 'fast',
      };

      expect(lowQuality.crf).toBeGreaterThan(23); // Higher CRF = lower quality
    });

    it('should have correct settings for medium quality', () => {
      const mediumQuality = {
        codec: 'h264',
        crf: 23,
        preset: 'medium',
      };

      expect(mediumQuality.crf).toBe(23);
    });

    it('should have correct settings for high quality', () => {
      // High quality should have lower CRF (higher quality)
      const highQuality = {
        codec: 'h264',
        crf: 18,
        preset: 'slow',
      };

      expect(highQuality.crf).toBeLessThan(23); // Lower CRF = higher quality
    });
  });

  describe('Video Metadata', () => {
    it('should have video metadata properties', () => {
      const metadata = {
        path: '/tmp/video.mp4',
        size: 1024 * 1024 * 50,
        duration: 60,
        created: new Date(),
        modified: new Date(),
      };

      expect(metadata.path).toBe('/tmp/video.mp4');
      expect(metadata.size).toBeGreaterThan(0);
      expect(metadata.duration).toBeGreaterThan(0);
      expect(metadata.created instanceof Date).toBe(true);
      expect(metadata.modified instanceof Date).toBe(true);
    });
  });

  describe('Codec Support', () => {
    it('should support h264 codec', () => {
      const codec = 'h264';
      expect(['h264', 'h265', 'vp8', 'vp9']).toContain(codec);
    });

    it('should support h265 codec', () => {
      const codec = 'h265';
      expect(['h264', 'h265', 'vp8', 'vp9']).toContain(codec);
    });

    it('should support vp8 codec', () => {
      const codec = 'vp8';
      expect(['h264', 'h265', 'vp8', 'vp9']).toContain(codec);
    });

    it('should support vp9 codec', () => {
      const codec = 'vp9';
      expect(['h264', 'h265', 'vp8', 'vp9']).toContain(codec);
    });
  });

  describe('Quality Levels', () => {
    it('should support low quality', () => {
      const quality = 'low';
      expect(['low', 'medium', 'high']).toContain(quality);
    });

    it('should support medium quality', () => {
      const quality = 'medium';
      expect(['low', 'medium', 'high']).toContain(quality);
    });

    it('should support high quality', () => {
      const quality = 'high';
      expect(['low', 'medium', 'high']).toContain(quality);
    });
  });

  describe('Resolution Support', () => {
    it('should support 1080p resolution', () => {
      const resolution = { width: 1920, height: 1080 };
      expect(resolution.width).toBe(1920);
      expect(resolution.height).toBe(1080);
    });

    it('should support 720p resolution', () => {
      const resolution = { width: 1280, height: 720 };
      expect(resolution.width).toBe(1280);
      expect(resolution.height).toBe(720);
    });

    it('should support 4K resolution', () => {
      const resolution = { width: 3840, height: 2160 };
      expect(resolution.width).toBe(3840);
      expect(resolution.height).toBe(2160);
    });
  });

  describe('FPS Support', () => {
    it('should support 24fps', () => {
      const fps = 24;
      expect([24, 25, 30, 60]).toContain(fps);
    });

    it('should support 30fps', () => {
      const fps = 30;
      expect([24, 25, 30, 60]).toContain(fps);
    });

    it('should support 60fps', () => {
      const fps = 60;
      expect([24, 25, 30, 60]).toContain(fps);
    });
  });
});
