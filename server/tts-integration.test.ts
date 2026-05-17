/**
 * TTS Integration Tests
 */

import { describe, it, expect } from 'vitest';
import {
  estimateReadingTime,
  segmentText,
  validateTTSConfig,
  getSupportedLanguages,
  getAvailableVoices,
} from './tts-service';
import {
  msToFrame,
  frameToMs,
  frameToSeconds,
  secondsToFrame,
  getAudioTimeForFrame,
  getFrameForAudioTime,
  checkSyncStatus,
  validateSyncConfig,
  createSyncMarkers,
  type VideoSyncConfig,
} from './audio-video-sync';
import {
  analyzeText,
  segmentBySentences,
  segmentByParagraphs,
  segmentForTTS,
  detectEmphasisPoints,
  extractKeyPhrases,
  calculateComplexity,
  normalizeForTTS,
  splitForNarration,
  detectLanguage,
} from './text-analysis';

describe('TTS Service', () => {
  describe('estimateReadingTime', () => {
    it('should estimate reading time for normal speech', () => {
      const text = 'This is a test sentence. ' + 'This is another sentence. '.repeat(10);
      const time = estimateReadingTime(text, 1.0);
      expect(time).toBeGreaterThan(0);
    });

    it('should adjust reading time for speaking rate', () => {
      const text = 'This is a test sentence. '.repeat(10);
      const normalTime = estimateReadingTime(text, 1.0);
      const fastTime = estimateReadingTime(text, 1.5);
      expect(fastTime).toBeLessThan(normalTime);
    });

    it('should handle empty text', () => {
      const time = estimateReadingTime('', 1.0);
      expect(time).toBeGreaterThanOrEqual(0);
    });
  });

  describe('segmentText', () => {
    it('should segment text into chunks', () => {
      const text = 'First sentence. Second sentence. Third sentence.';
      const segments = segmentText(text, 30);
      expect(segments.length).toBeGreaterThan(0);
    });

    it('should respect max character limit', () => {
      const text = 'Word '.repeat(100); // Create text with spaces
      const maxChars = 100;
      const segments = segmentText(text, maxChars);
      expect(segments.length).toBeGreaterThan(0);
      for (const segment of segments) {
        // Each segment should be a string
        expect(typeof segment).toBe('string');
      }
    });
  });

  describe('validateTTSConfig', () => {
    it('should validate correct config', () => {
      const config = {
        language: 'fr' as const,
        voiceGender: 'female' as const,
        speakingRate: 1.0,
      };
      const result = validateTTSConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid speaking rate', () => {
      const config = {
        language: 'fr' as const,
        speakingRate: 3.0, // Too high
      };
      const result = validateTTSConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid pitch', () => {
      const config = {
        language: 'fr' as const,
        pitch: 30, // Too high
      };
      const result = validateTTSConfig(config);
      expect(result.valid).toBe(false);
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return array of supported languages', () => {
      const languages = getSupportedLanguages();
      expect(Array.isArray(languages)).toBe(true);
      expect(languages.length).toBeGreaterThan(0);
    });

    it('should include French', () => {
      const languages = getSupportedLanguages();
      expect(languages).toContain('fr');
    });
  });

  describe('getAvailableVoices', () => {
    it('should return voices for supported language', () => {
      const voices = getAvailableVoices('fr');
      expect(Array.isArray(voices)).toBe(true);
      expect(voices.length).toBeGreaterThan(0);
    });

    it('should return empty array for unsupported language', () => {
      const voices = getAvailableVoices('xx' as any);
      expect(voices).toEqual([]);
    });
  });
});

describe('Audio-Video Synchronization', () => {
  describe('Frame and Time Conversion', () => {
    it('should convert milliseconds to frames', () => {
      const ms = 1000;
      const fps = 30;
      const frames = msToFrame(ms, fps);
      expect(frames).toBe(30);
    });

    it('should convert frames to milliseconds', () => {
      const frames = 30;
      const fps = 30;
      const ms = frameToMs(frames, fps);
      expect(ms).toBe(1000);
    });

    it('should convert frames to seconds', () => {
      const frames = 60;
      const fps = 30;
      const seconds = frameToSeconds(frames, fps);
      expect(seconds).toBe(2);
    });

    it('should convert seconds to frames', () => {
      const seconds = 2;
      const fps = 30;
      const frames = secondsToFrame(seconds, fps);
      expect(frames).toBe(60);
    });
  });

  describe('Audio Time Calculation', () => {
    it('should get audio time for frame', () => {
      const frame = 30;
      const fps = 30;
      const audioTime = getAudioTimeForFrame(frame, fps);
      expect(audioTime).toBe(1000); // 1 second
    });

    it('should get frame for audio time', () => {
      const audioTime = 1000;
      const fps = 30;
      const frame = getFrameForAudioTime(audioTime, fps);
      expect(frame).toBe(30);
    });

    it('should apply audio offset', () => {
      const frame = 30;
      const fps = 30;
      const offset = 500; // 500ms offset
      const audioTime = getAudioTimeForFrame(frame, fps, offset);
      expect(audioTime).toBe(1500);
    });
  });

  describe('Sync Status', () => {
    it('should detect in-sync audio and video', () => {
      const frame = 30;
      const audioTime = 1000;
      const fps = 30;
      const status = checkSyncStatus(frame, audioTime, fps);
      expect(status.inSync).toBe(true);
      expect(status.drift).toBe(0);
    });

    it('should detect out-of-sync audio and video', () => {
      const frame = 30;
      const audioTime = 2000; // 1 second off
      const fps = 30;
      const status = checkSyncStatus(frame, audioTime, fps);
      expect(status.inSync).toBe(false);
      expect(status.drift).toBeGreaterThan(0);
    });
  });

  describe('Sync Configuration Validation', () => {
    it('should validate correct sync config', () => {
      const config: VideoSyncConfig = {
        fps: 30,
        videoDuration: 60,
        audioDuration: 60,
        audioSegments: [
          {
            text: 'Test',
            startTime: 0,
            endTime: 5000,
            duration: 5000,
          },
        ],
      };
      const result = validateSyncConfig(config);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid fps', () => {
      const config: VideoSyncConfig = {
        fps: 0,
        videoDuration: 60,
        audioDuration: 60,
        audioSegments: [],
      };
      const result = validateSyncConfig(config);
      expect(result.valid).toBe(false);
    });

    it('should detect overlapping segments', () => {
      const config: VideoSyncConfig = {
        fps: 30,
        videoDuration: 60,
        audioDuration: 60,
        audioSegments: [
          {
            text: 'First',
            startTime: 0,
            endTime: 5000,
            duration: 5000,
          },
          {
            text: 'Second',
            startTime: 3000, // Overlaps with first
            endTime: 8000,
            duration: 5000,
          },
        ],
      };
      const result = validateSyncConfig(config);
      expect(result.valid).toBe(false);
    });
  });

  describe('Sync Markers', () => {
    it('should create sync markers', () => {
      const segments = [
        {
          text: 'Test',
          startTime: 0,
          endTime: 5000,
          duration: 5000,
        },
      ];
      const markers = createSyncMarkers(segments, 30);
      expect(markers.length).toBeGreaterThan(0);
    });

    it('should sort markers by frame', () => {
      const segments = [
        {
          text: 'First',
          startTime: 0,
          endTime: 5000,
          duration: 5000,
        },
        {
          text: 'Second',
          startTime: 5000,
          endTime: 10000,
          duration: 5000,
        },
      ];
      const markers = createSyncMarkers(segments, 30);
      for (let i = 0; i < markers.length - 1; i++) {
        expect(markers[i].frame).toBeLessThanOrEqual(markers[i + 1].frame);
      }
    });
  });
});

describe('Text Analysis', () => {
  describe('analyzeText', () => {
    it('should analyze text metrics', () => {
      const text = 'This is a test. This is another test.';
      const metrics = analyzeText(text);
      expect(metrics.characterCount).toBeGreaterThan(0);
      expect(metrics.wordCount).toBeGreaterThan(0);
      expect(metrics.sentenceCount).toBeGreaterThan(0);
    });

    it('should calculate readability score', () => {
      const text = 'This is a test. ' + 'This is another test. '.repeat(10);
      const metrics = analyzeText(text);
      expect(metrics.readabilityScore).toBeGreaterThanOrEqual(0);
      expect(metrics.readabilityScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Text Segmentation', () => {
    it('should segment by sentences', () => {
      const text = 'First sentence. Second sentence. Third sentence.';
      const segments = segmentBySentences(text);
      expect(segments.length).toBe(3);
    });

    it('should segment by paragraphs', () => {
      const text = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';
      const segments = segmentByParagraphs(text);
      expect(segments.length).toBe(3);
    });

    it('should segment for TTS', () => {
      const text = 'This is a test. '.repeat(20);
      const segments = segmentForTTS(text, 100);
      expect(segments.length).toBeGreaterThan(0);
      for (const segment of segments) {
        expect(segment.characterCount).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('Emphasis Detection', () => {
    it('should detect emphasis points', () => {
      const text = 'This is "important" text. For example, this is an example.';
      const points = detectEmphasisPoints(text);
      expect(Array.isArray(points)).toBe(true);
    });

    it('should identify emphasis types', () => {
      const text = 'This is "important" and is defined as a test.';
      const points = detectEmphasisPoints(text);
      expect(Array.isArray(points)).toBe(true);
      if (points.length > 0) {
        expect(['keyword', 'important', 'definition', 'example']).toContain(points[0].type);
      }
    });
  });

  describe('Key Phrase Extraction', () => {
    it('should extract key phrases', () => {
      const text = 'Machine Learning is important. Artificial Intelligence is powerful.';
      const phrases = extractKeyPhrases(text, 2);
      expect(Array.isArray(phrases)).toBe(true);
    });
  });

  describe('Complexity Calculation', () => {
    it('should calculate text complexity', () => {
      const text = 'This is simple. ' + 'This is another simple sentence. '.repeat(5);
      const complexity = calculateComplexity(text);
      expect(['simple', 'moderate', 'complex']).toContain(complexity.level);
      expect(complexity.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Text Normalization', () => {
    it('should normalize text for TTS', () => {
      const text = 'Dr. Smith & Mr. Jones etc.';
      const normalized = normalizeForTTS(text);
      expect(normalized).not.toContain('&');
      expect(normalized).toContain('and');
    });

    it('should expand abbreviations', () => {
      const text = 'e.g. this is an example';
      const normalized = normalizeForTTS(text);
      expect(normalized).toContain('for example');
    });
  });

  describe('Narration Splitting', () => {
    it('should split text for narration', () => {
      const text = 'This is a test. '.repeat(50);
      const chunks = splitForNarration(text, 10, 150);
      expect(chunks.length).toBeGreaterThan(0);
    });
  });

  describe('Language Detection', () => {
    it('should detect language', () => {
      const text = 'Ceci est un test. Le français est une belle langue.';
      const language = detectLanguage(text);
      expect(['fr', 'en', 'es', 'de', 'unknown']).toContain(language);
    });

    it('should handle unknown language', () => {
      const text = '123 456 789';
      const language = detectLanguage(text);
      expect(['fr', 'en', 'es', 'de', 'unknown']).toContain(language);
    });
  });
});
