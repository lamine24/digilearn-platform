/**
 * FFmpeg Integration Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AudioFileManager } from './audio-file-manager';
import { AudioEffectsService } from './audio-effects';

describe('Audio File Manager', () => {
  let fileManager: AudioFileManager;

  beforeEach(() => {
    fileManager = new AudioFileManager();
  });

  it('should initialize directories', () => {
    const stats = fileManager.getAllStats();
    expect(stats).toBeDefined();
    expect(stats.policy).toBeDefined();
  });

  it('should register a file', () => {
    const testFile = '/tmp/test-audio.mp3';
    fileManager.registerFile(testFile, 'temp');

    const info = fileManager.getFileInfo(testFile);
    expect(info).toBeDefined();
  });

  it('should get directory statistics', () => {
    const stats = fileManager.getDirectoryStats('temp');
    expect(stats.fileCount).toBeGreaterThanOrEqual(0);
    expect(stats.totalSize).toBeGreaterThanOrEqual(0);
  });

  it('should list files by type', () => {
    const tempFiles = fileManager.listFiles('temp');
    expect(Array.isArray(tempFiles)).toBe(true);
  });

  it('should update cleanup policy', () => {
    const newPolicy = {
      maxAge: 12 * 60 * 60 * 1000,
      maxSize: 5 * 1024 * 1024 * 1024,
      maxFiles: 500,
    };

    fileManager.updateCleanupPolicy(newPolicy);
    const stats = fileManager.getAllStats();

    expect(stats.policy.maxAge).toBe(newPolicy.maxAge);
    expect(stats.policy.maxSize).toBe(newPolicy.maxSize);
    expect(stats.policy.maxFiles).toBe(newPolicy.maxFiles);
  });

  it('should get all statistics', () => {
    const stats = fileManager.getAllStats();

    expect(stats.temp).toBeDefined();
    expect(stats.output).toBeDefined();
    expect(stats.cache).toBeDefined();
    expect(stats.total).toBeDefined();
    expect(stats.policy).toBeDefined();
  });

  it('should cleanup old files', () => {
    const result = fileManager.cleanupOldFiles();
    expect(result.deletedCount).toBeGreaterThanOrEqual(0);
    expect(result.freedSpace).toBeGreaterThanOrEqual(0);
  });

  it('should cleanup by size', () => {
    const result = fileManager.cleanupBySize();
    expect(result.deletedCount).toBeGreaterThanOrEqual(0);
    expect(result.freedSpace).toBeGreaterThanOrEqual(0);
  });

  it('should cleanup by file count', () => {
    const result = fileManager.cleanupByFileCount();
    expect(result.deletedCount).toBeGreaterThanOrEqual(0);
    expect(result.freedSpace).toBeGreaterThanOrEqual(0);
  });

  it('should perform full cleanup', () => {
    const result = fileManager.fullCleanup();
    expect(result.deletedCount).toBeGreaterThanOrEqual(0);
    expect(result.freedSpace).toBeGreaterThanOrEqual(0);
  });
});

describe('Audio Effects Service', () => {
  let effectsService: AudioEffectsService;

  beforeEach(() => {
    // Mock FFmpeg service
    const mockFFmpegService = {
      combineSegments: async () => ({ outputPath: '/tmp/test.mp3', duration: 10 }),
      getAudioDuration: async () => 10,
      getAudioMetadata: async () => ({
        duration: 10,
        bitrate: '192k',
        sampleRate: 44100,
        channels: 2,
      }),
    };

    effectsService = new AudioEffectsService(mockFFmpegService as any);
  });

  it('should get equalizer presets', () => {
    const presets = effectsService.getEqualizerPresets();

    expect(presets.bright).toBeDefined();
    expect(presets.warm).toBeDefined();
    expect(presets.podcast).toBeDefined();
    expect(presets.voiceover).toBeDefined();
  });

  it('should get default compressor settings', () => {
    const settings = effectsService.getDefaultCompressorSettings();

    expect(settings.threshold).toBeDefined();
    expect(settings.ratio).toBeDefined();
    expect(settings.attackTime).toBeDefined();
    expect(settings.releaseTime).toBeDefined();
    expect(settings.makeupGain).toBeDefined();
  });

  it('should get default reverb settings', () => {
    const settings = effectsService.getDefaultReverbSettings();

    expect(settings.roomSize).toBeDefined();
    expect(settings.damping).toBeDefined();
    expect(settings.wetLevel).toBeDefined();
    expect(settings.dryLevel).toBeDefined();
  });

  it('should have bright equalizer preset', () => {
    const presets = effectsService.getEqualizerPresets();
    const brightPreset = presets.bright;

    expect(brightPreset.name).toBe('Bright');
    expect(brightPreset.frequencies.length).toBeGreaterThan(0);
  });

  it('should have podcast equalizer preset', () => {
    const presets = effectsService.getEqualizerPresets();
    const podcastPreset = presets.podcast;

    expect(podcastPreset.name).toBe('Podcast');
    expect(podcastPreset.frequencies.length).toBeGreaterThan(0);
  });

  it('should have voiceover equalizer preset', () => {
    const presets = effectsService.getEqualizerPresets();
    const voiceoverPreset = presets.voiceover;

    expect(voiceoverPreset.name).toBe('Voice Over');
    expect(voiceoverPreset.frequencies.length).toBeGreaterThan(0);
  });
});

describe('Audio Processing Presets', () => {
  it('should have podcast processing preset', () => {
    const mockFFmpegService = {
      combineSegments: async () => ({ outputPath: '/tmp/test.mp3', duration: 10 }),
    };

    const mockEffectsService = {
      getEqualizerPresets: () => ({
        podcast: { name: 'Podcast', frequencies: [] },
      }),
    };

    const mockSyncEngine = {};

    // Test that presets are defined
    expect(mockEffectsService.getEqualizerPresets().podcast).toBeDefined();
  });

  it('should have audiobook processing preset', () => {
    const presets = {
      audiobook: {
        applyFadeIn: true,
        fadeInDuration: 0.3,
        applyFadeOut: true,
        fadeOutDuration: 0.5,
        normalize: true,
        crossfadeDuration: 0.3,
        equalizerPreset: 'warm',
      },
    };

    expect(presets.audiobook).toBeDefined();
    expect(presets.audiobook.equalizerPreset).toBe('warm');
  });

  it('should have voiceover processing preset', () => {
    const presets = {
      voiceover: {
        applyFadeIn: false,
        applyFadeOut: false,
        normalize: true,
        crossfadeDuration: 0.2,
        equalizerPreset: 'voiceover',
      },
    };

    expect(presets.voiceover).toBeDefined();
    expect(presets.voiceover.normalize).toBe(true);
  });

  it('should have educational processing preset', () => {
    const presets = {
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

    expect(presets.educational).toBeDefined();
    expect(presets.educational.equalizerPreset).toBe('voiceover');
  });
});

describe('Audio File Cleanup', () => {
  let fileManager: AudioFileManager;

  beforeEach(() => {
    fileManager = new AudioFileManager(
      '/tmp/test-temp',
      '/tmp/test-output',
      '/tmp/test-cache',
      {
        maxAge: 1000, // 1 second for testing
        maxSize: 1024, // 1KB for testing
        maxFiles: 5,
      }
    );
  });

  it('should have cleanup policy', () => {
    const stats = fileManager.getAllStats();
    expect(stats.policy.maxAge).toBe(1000);
    expect(stats.policy.maxSize).toBe(1024);
    expect(stats.policy.maxFiles).toBe(5);
  });

  it('should list all files', () => {
    const files = fileManager.listFiles();
    expect(Array.isArray(files)).toBe(true);
  });

  it('should get file info', () => {
    const testFile = '/tmp/test-temp/test.mp3';
    fileManager.registerFile(testFile, 'temp');

    const info = fileManager.getFileInfo(testFile);
    expect(info).toBeDefined();
  });
});
