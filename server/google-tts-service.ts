/**
 * Google Cloud Text-to-Speech Service
 * Generates high-quality audio from text using Google Cloud TTS API
 */

import textToSpeech from '@google-cloud/text-to-speech';
import * as fs from 'fs';
import * as path from 'path';

export interface TTSConfig {
  projectId: string;
  credentialsPath?: string;
  outputDir?: string;
}

export interface VoiceConfig {
  languageCode: string;
  name: string;
  ssmlGender: 'MALE' | 'FEMALE' | 'NEUTRAL';
  pitch?: number;
  speakingRate?: number;
}

export interface AudioSegment {
  text: string;
  startTime: number;
  duration: number;
  audioUrl?: string;
  audioBuffer?: Buffer;
}

export interface TTSResult {
  audioUrl: string;
  audioBuffer: Buffer;
  duration: number;
  wordCount: number;
  characterCount: number;
}

/**
 * Google Cloud TTS Service
 */
export class GoogleTTSService {
  private client: textToSpeech.TextToSpeechClient;
  private projectId: string;
  private outputDir: string;

  // Supported voices
  private readonly VOICES = {
    fr: {
      FEMALE: 'fr-FR-Neural2-A',
      MALE: 'fr-FR-Neural2-B',
      NEUTRAL: 'fr-FR-Neural2-C',
    },
    en: {
      FEMALE: 'en-US-Neural2-C',
      MALE: 'en-US-Neural2-A',
      NEUTRAL: 'en-US-Neural2-E',
    },
    es: {
      FEMALE: 'es-ES-Neural2-A',
      MALE: 'es-ES-Neural2-B',
      NEUTRAL: 'es-ES-Neural2-C',
    },
    de: {
      FEMALE: 'de-DE-Neural2-A',
      MALE: 'de-DE-Neural2-B',
      NEUTRAL: 'de-DE-Neural2-C',
    },
    pt: {
      FEMALE: 'pt-BR-Neural2-A',
      MALE: 'pt-BR-Neural2-B',
      NEUTRAL: 'pt-BR-Neural2-C',
    },
    ja: {
      FEMALE: 'ja-JP-Neural2-B',
      MALE: 'ja-JP-Neural2-C',
      NEUTRAL: 'ja-JP-Neural2-A',
    },
    zh: {
      FEMALE: 'zh-CN-Neural2-A',
      MALE: 'zh-CN-Neural2-B',
      NEUTRAL: 'zh-CN-Neural2-C',
    },
    ar: {
      FEMALE: 'ar-XA-Neural2-A',
      MALE: 'ar-XA-Neural2-B',
      NEUTRAL: 'ar-XA-Neural2-C',
    },
  };

  constructor(config: TTSConfig) {
    this.projectId = config.projectId;
    this.outputDir = config.outputDir || '/tmp/tts-audio';

    // Initialize Google Cloud TTS client
    if (config.credentialsPath) {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = config.credentialsPath;
    }

    this.client = new textToSpeech.TextToSpeechClient();

    // Create output directory if it doesn't exist
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    console.log('[Google TTS] Service initialized');
  }

  /**
   * Get available voices for a language
   */
  getAvailableVoices(languageCode: string): string[] {
    const lang = languageCode.split('-')[0];
    const voices = this.VOICES[lang as keyof typeof this.VOICES];
    return voices ? Object.values(voices) : [];
  }

  /**
   * Synthesize speech from text
   */
  async synthesizeSpeech(
    text: string,
    languageCode: string = 'fr-FR',
    voiceGender: 'MALE' | 'FEMALE' | 'NEUTRAL' = 'FEMALE',
    options?: {
      pitch?: number;
      speakingRate?: number;
      audioEncoding?: 'MP3' | 'LINEAR16' | 'OGG_OPUS';
    }
  ): Promise<TTSResult> {
    try {
      const lang = languageCode.split('-')[0];
      const voiceName = this.VOICES[lang as keyof typeof this.VOICES]?.[voiceGender];

      if (!voiceName) {
        throw new Error(`Voice not found for language: ${languageCode}, gender: ${voiceGender}`);
      }

      const request = {
        input: { text },
        voice: {
          languageCode,
          name: voiceName,
          ssmlGender: voiceGender,
        },
        audioConfig: {
          audioEncoding: options?.audioEncoding || 'MP3',
          pitch: options?.pitch || 0,
          speakingRate: options?.speakingRate || 1.0,
        },
      };

      console.log(`[Google TTS] Synthesizing: "${text.substring(0, 50)}..."`);

      const [response] = await this.client.synthesizeSpeech(request);
      const audioBuffer = response.audioContent as Buffer;

      if (!audioBuffer) {
        throw new Error('No audio content received from TTS API');
      }

      // Save audio file
      const filename = `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.mp3`;
      const filepath = path.join(this.outputDir, filename);
      fs.writeFileSync(filepath, audioBuffer);

      // Estimate duration (MP3 at ~128kbps = 16KB per second)
      const estimatedDuration = audioBuffer.length / 16000;

      const result: TTSResult = {
        audioUrl: filepath,
        audioBuffer,
        duration: estimatedDuration,
        wordCount: text.split(/\s+/).length,
        characterCount: text.length,
      };

      console.log(`[Google TTS] Synthesized: ${estimatedDuration.toFixed(2)}s, ${audioBuffer.length} bytes`);

      return result;
    } catch (error) {
      console.error('[Google TTS] Synthesis error:', error);
      throw error;
    }
  }

  /**
   * Synthesize multiple segments with timing
   */
  async synthesizeSegments(
    segments: AudioSegment[],
    languageCode: string = 'fr-FR',
    voiceGender: 'MALE' | 'FEMALE' | 'NEUTRAL' = 'FEMALE'
  ): Promise<AudioSegment[]> {
    const results: AudioSegment[] = [];
    let currentTime = 0;

    for (const segment of segments) {
      try {
        const ttsResult = await this.synthesizeSpeech(segment.text, languageCode, voiceGender);

        results.push({
          ...segment,
          startTime: currentTime,
          duration: ttsResult.duration,
          audioUrl: ttsResult.audioUrl,
          audioBuffer: ttsResult.audioBuffer,
        });

        currentTime += ttsResult.duration;
      } catch (error) {
        console.error(`[Google TTS] Failed to synthesize segment: ${segment.text}`, error);
        throw error;
      }
    }

    return results;
  }

  /**
   * Estimate duration without generating audio
   */
  estimateDuration(text: string, speakingRate: number = 1.0): number {
    // Average speaking rate: 150 words per minute = 2.5 words per second
    const wordCount = text.split(/\s+/).length;
    const baseRate = 2.5; // words per second
    const adjustedRate = baseRate * speakingRate;
    return wordCount / adjustedRate;
  }

  /**
   * Get SSML-formatted text for advanced control
   */
  createSSML(
    text: string,
    options?: {
      pitch?: number;
      rate?: number;
      volume?: number;
      emphasis?: 'strong' | 'moderate' | 'reduced';
      pause?: number; // milliseconds
    }
  ): string {
    let ssml = '<speak>';

    if (options?.pitch || options?.rate || options?.volume) {
      ssml += '<prosody';
      if (options.pitch) ssml += ` pitch="${options.pitch}%"`;
      if (options.rate) ssml += ` rate="${options.rate}%"`;
      if (options.volume) ssml += ` volume="${options.volume}dB"`;
      ssml += '>';
    }

    if (options?.emphasis) {
      ssml += `<emphasis level="${options.emphasis}">`;
    }

    ssml += text;

    if (options?.emphasis) {
      ssml += '</emphasis>';
    }

    if (options?.pitch || options?.rate || options?.volume) {
      ssml += '</prosody>';
    }

    if (options?.pause) {
      ssml += `<break time="${options.pause}ms"/>`;
    }

    ssml += '</speak>';

    return ssml;
  }

  /**
   * Synthesize SSML
   */
  async synthesizeSSML(
    ssml: string,
    languageCode: string = 'fr-FR',
    voiceGender: 'MALE' | 'FEMALE' | 'NEUTRAL' = 'FEMALE'
  ): Promise<TTSResult> {
    try {
      const lang = languageCode.split('-')[0];
      const voiceName = this.VOICES[lang as keyof typeof this.VOICES]?.[voiceGender];

      if (!voiceName) {
        throw new Error(`Voice not found for language: ${languageCode}`);
      }

      const request = {
        input: { ssml },
        voice: {
          languageCode,
          name: voiceName,
          ssmlGender: voiceGender,
        },
        audioConfig: {
          audioEncoding: 'MP3',
        },
      };

      console.log('[Google TTS] Synthesizing SSML');

      const [response] = await this.client.synthesizeSpeech(request);
      const audioBuffer = response.audioContent as Buffer;

      if (!audioBuffer) {
        throw new Error('No audio content received from TTS API');
      }

      const filename = `audio-ssml-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.mp3`;
      const filepath = path.join(this.outputDir, filename);
      fs.writeFileSync(filepath, audioBuffer);

      const estimatedDuration = audioBuffer.length / 16000;

      return {
        audioUrl: filepath,
        audioBuffer,
        duration: estimatedDuration,
        wordCount: 0,
        characterCount: ssml.length,
      };
    } catch (error) {
      console.error('[Google TTS] SSML synthesis error:', error);
      throw error;
    }
  }

  /**
   * Clean up audio files
   */
  cleanupAudioFiles(filepaths: string[]): void {
    for (const filepath of filepaths) {
      try {
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
          console.log(`[Google TTS] Deleted: ${filepath}`);
        }
      } catch (error) {
        console.error(`[Google TTS] Failed to delete: ${filepath}`, error);
      }
    }
  }

  /**
   * Get service statistics
   */
  getStats(): {
    outputDir: string;
    audioFilesCount: number;
    totalSize: number;
  } {
    const files = fs.readdirSync(this.outputDir);
    let totalSize = 0;

    for (const file of files) {
      const filepath = path.join(this.outputDir, file);
      const stats = fs.statSync(filepath);
      totalSize += stats.size;
    }

    return {
      outputDir: this.outputDir,
      audioFilesCount: files.length,
      totalSize,
    };
  }
}

/**
 * Global TTS service instance
 */
let globalTTSService: GoogleTTSService | null = null;

/**
 * Initialize global TTS service
 */
export function initializeTTSService(config: TTSConfig): GoogleTTSService {
  if (!globalTTSService) {
    globalTTSService = new GoogleTTSService(config);
  }
  return globalTTSService;
}

/**
 * Get global TTS service
 */
export function getTTSService(): GoogleTTSService {
  if (!globalTTSService) {
    throw new Error('TTS service not initialized. Call initializeTTSService first.');
  }
  return globalTTSService;
}
