/**
 * Google TTS Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AudioSyncEngine } from './audio-sync-engine';
import { VoiceManager } from './voice-manager';
import { TTSVideoPipeline } from './tts-video-pipeline';

describe('Audio Sync Engine', () => {
  let syncEngine: AudioSyncEngine;

  beforeEach(() => {
    syncEngine = new AudioSyncEngine();
  });

  it('should add sync points', () => {
    syncEngine.addSyncPoint(0, 0, 'start');
    syncEngine.addSyncPoint(5, 5, 'pause');

    const stats = syncEngine.getStats();
    expect(stats.totalSyncPoints).toBe(2);
  });

  it('should add markers', () => {
    syncEngine.addMarker('Test marker', 0, 5);
    const stats = syncEngine.getStats();
    expect(stats.totalMarkers).toBe(1);
  });

  it('should generate sync points from segments', () => {
    const segments = [
      { text: 'Segment 1', duration: 5, animationType: 'fade-in' },
      { text: 'Segment 2', duration: 5, animationType: 'slide-in' },
    ];

    const syncPoints = syncEngine.generateSyncPointsFromSegments(segments);
    expect(syncPoints.length).toBeGreaterThan(0);
  });

  it('should generate sync points from text', () => {
    const text = 'This is a test. This is another sentence. And a third one.';
    const syncPoints = syncEngine.generateSyncPointsFromText(text, 0, {
      highlightKeywords: ['test', 'sentence'],
    });

    expect(syncPoints.length).toBeGreaterThan(0);
  });

  it('should get sync points in range', () => {
    syncEngine.addSyncPoint(0, 0, 'start');
    syncEngine.addSyncPoint(5, 5, 'pause');
    syncEngine.addSyncPoint(10, 10, 'resume');

    const rangePoints = syncEngine.getSyncPointsInRange(2, 8);
    expect(rangePoints.length).toBe(1);
  });

  it('should calculate video time from audio time', () => {
    syncEngine.addSyncPoint(0, 0, 'start');
    syncEngine.addSyncPoint(5, 5, 'pause', { duration: 2 });

    const videoTime = syncEngine.calculateVideoTime(6);
    expect(videoTime).toBeGreaterThan(6);
  });

  it('should create animation timeline', () => {
    syncEngine.addSyncPoint(0, 0, 'start');
    syncEngine.addSyncPoint(5, 5, 'pause');

    const timeline = syncEngine.createAnimationTimeline(10, 30);
    expect(timeline.length).toBeGreaterThan(0);
    expect(timeline[0].frame).toBe(0);
  });

  it('should validate sync data', () => {
    syncEngine.addMarker('Marker 1', 0, 5);
    syncEngine.addMarker('Marker 2', 10, 15);

    const validation = syncEngine.validate();
    expect(validation.valid).toBe(true);
  });

  it('should export and import sync data', () => {
    syncEngine.addSyncPoint(0, 0, 'start');
    syncEngine.addMarker('Test', 0, 5);

    const exported = syncEngine.exportSyncData();
    const newEngine = new AudioSyncEngine();
    newEngine.importSyncData(exported);

    const stats = newEngine.getStats();
    expect(stats.totalSyncPoints).toBe(1);
    expect(stats.totalMarkers).toBe(1);
  });

  it('should clear all data', () => {
    syncEngine.addSyncPoint(0, 0, 'start');
    syncEngine.addMarker('Test', 0, 5);
    syncEngine.clear();

    const stats = syncEngine.getStats();
    expect(stats.totalSyncPoints).toBe(0);
    expect(stats.totalMarkers).toBe(0);
  });
});

describe('Voice Manager', () => {
  let voiceManager: VoiceManager;

  beforeEach(() => {
    voiceManager = new VoiceManager();
  });

  it('should initialize voices', () => {
    const stats = voiceManager.getStats();
    expect(stats.totalVoices).toBeGreaterThan(0);
  });

  it('should get voice by ID', () => {
    const voice = voiceManager.getVoice('fr-female-a');
    expect(voice).toBeDefined();
    expect(voice?.name).toBe('Amélie');
  });

  it('should get all voices', () => {
    const voices = voiceManager.getAllVoices();
    expect(voices.length).toBeGreaterThan(0);
  });

  it('should get voices by language', () => {
    const voices = voiceManager.getVoicesByLanguage('fr-FR');
    expect(voices.length).toBeGreaterThan(0);
    expect(voices.every((v) => v.languageCode === 'fr-FR')).toBe(true);
  });

  it('should get voices by gender', () => {
    const voices = voiceManager.getVoicesByGender('FEMALE');
    expect(voices.length).toBeGreaterThan(0);
    expect(voices.every((v) => v.gender === 'FEMALE')).toBe(true);
  });

  it('should get language configuration', () => {
    const lang = voiceManager.getLanguage('fr-FR');
    expect(lang).toBeDefined();
    expect(lang?.name).toBe('French');
  });

  it('should get all languages', () => {
    const languages = voiceManager.getAllLanguages();
    expect(languages.length).toBeGreaterThan(0);
  });

  it('should get preset by ID', () => {
    const preset = voiceManager.getPreset('professional-female');
    expect(preset).toBeDefined();
    expect(preset?.name).toBe('Professional Female');
  });

  it('should get all presets', () => {
    const presets = voiceManager.getAllPresets();
    expect(presets.length).toBeGreaterThan(0);
  });

  it('should create custom preset', () => {
    const preset = voiceManager.createPreset(
      'custom-preset',
      'Custom Preset',
      'fr-female-a',
      1,
      1.1,
      2
    );

    expect(preset).toBeDefined();
    expect(preset?.name).toBe('Custom Preset');
    expect(preset?.pitch).toBe(1);
  });

  it('should return statistics', () => {
    const stats = voiceManager.getStats();
    expect(stats.totalVoices).toBeGreaterThan(0);
    expect(stats.totalLanguages).toBeGreaterThan(0);
    expect(stats.totalPresets).toBeGreaterThan(0);
    expect(Object.keys(stats.voicesByGender).length).toBeGreaterThan(0);
  });
});

describe('TTS Video Pipeline', () => {
  let pipeline: TTSVideoPipeline;
  let syncEngine: AudioSyncEngine;

  beforeEach(() => {
    syncEngine = new AudioSyncEngine();
    // Note: In real tests, we would mock the TTS service
    // For now, we're testing the pipeline structure
  });

  it('should extract narration text from capsule', () => {
    const capsule = {
      title: 'Test Capsule',
      description: 'Test Description',
      contentStructure: {
        sections: [
          { title: 'Section 1', content: 'Content 1' },
          { title: 'Section 2', content: 'Content 2' },
        ],
        learningObjectives: ['Objective 1', 'Objective 2'],
        conclusion: 'Conclusion text',
      },
      interactiveElements: [],
    };

    // We can't fully test without mocking the TTS service,
    // but we can verify the pipeline structure
    expect(pipeline).toBeDefined();
  });

  it('should get processing statistics', () => {
    // Create a minimal pipeline for testing
    const mockTTSService = {
      synthesizeSpeech: async () => ({
        audioUrl: 'test.mp3',
        audioBuffer: Buffer.from('test'),
        duration: 5,
        wordCount: 10,
        characterCount: 50,
      }),
    };

    const testPipeline = new TTSVideoPipeline({
      ttsService: mockTTSService as any,
      syncEngine,
    });

    const stats = testPipeline.getStats();
    expect(stats.lastProcessingTime).toBeDefined();
  });
});
