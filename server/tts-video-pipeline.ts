/**
 * TTS Video Pipeline Integration
 * Integrates Google Cloud TTS with video generation pipeline
 */

import { GoogleTTSService } from './google-tts-service';
import { AudioSyncEngine } from './audio-sync-engine';
import type { CapsuleData } from './video-generation';

export interface TTSPipelineConfig {
  ttsService: GoogleTTSService;
  syncEngine: AudioSyncEngine;
  defaultLanguage?: string;
  defaultVoiceGender?: 'MALE' | 'FEMALE' | 'NEUTRAL';
  options?: {
    pitch?: number;
    speakingRate?: number;
    audioEncoding?: 'MP3' | 'LINEAR16' | 'OGG_OPUS';
  };
}

export interface TTSPipelineResult {
  audioUrl: string;
  audioBuffer: Buffer;
  duration: number;
  syncData: any;
  metadata: {
    textLength: number;
    wordCount: number;
    segmentCount: number;
    processingTime: number;
  };
}

/**
 * TTS Video Pipeline
 */
export class TTSVideoPipeline {
  private config: TTSPipelineConfig;
  private processingTime: number = 0;

  constructor(config: TTSPipelineConfig) {
    this.config = config;
  }

  /**
   * Process capsule data and generate audio
   */
  async processCapsule(capsule: CapsuleData): Promise<TTSPipelineResult> {
    const startTime = Date.now();

    try {
      console.log(`[TTS Pipeline] Processing capsule: ${capsule.title}`);

      const narrationText = this.extractNarrationText(capsule);
      console.log(`[TTS Pipeline] Narration text: ${narrationText.length} characters`);

      const ttsResult = await this.config.ttsService.synthesizeSpeech(
        narrationText,
        this.config.defaultLanguage || 'fr-FR',
        this.config.defaultVoiceGender || 'FEMALE',
        this.config.options
      );

      const syncData = this.generateSyncPoints(capsule, ttsResult.duration);

      this.processingTime = Date.now() - startTime;

      const result: TTSPipelineResult = {
        audioUrl: ttsResult.audioUrl,
        audioBuffer: ttsResult.audioBuffer,
        duration: ttsResult.duration,
        syncData,
        metadata: {
          textLength: narrationText.length,
          wordCount: ttsResult.wordCount,
          segmentCount: capsule.contentStructure?.sections?.length || 1,
          processingTime: this.processingTime,
        },
      };

      console.log(`[TTS Pipeline] Processed in ${this.processingTime}ms`);
      return result;
    } catch (error) {
      console.error('[TTS Pipeline] Processing error:', error);
      throw error;
    }
  }

  /**
   * Extract narration text from capsule
   */
  private extractNarrationText(capsule: CapsuleData): string {
    const parts: string[] = [];

    if (capsule.title) {
      parts.push(capsule.title);
    }

    if (capsule.description) {
      parts.push(capsule.description);
    }

    if (capsule.contentStructure?.sections) {
      for (const section of capsule.contentStructure.sections) {
        if (section.title) parts.push(section.title);
        if (section.content) parts.push(section.content);
      }
    }

    if (capsule.contentStructure?.learningObjectives) {
      parts.push('Learning objectives:');
      for (const objective of capsule.contentStructure.learningObjectives) {
        parts.push(objective);
      }
    }

    if (capsule.contentStructure?.conclusion) {
      parts.push(capsule.contentStructure.conclusion);
    }

    return parts.filter((p) => p && p.trim().length > 0).join('. ');
  }

  /**
   * Generate sync points from capsule structure
   */
  private generateSyncPoints(capsule: CapsuleData, totalDuration: number): any {
    const sections = capsule.contentStructure?.sections || [];
    const syncEngine = this.config.syncEngine;
    syncEngine.clear();

    if (sections.length === 0) {
      return syncEngine.exportSyncData();
    }

    const timePerSection = totalDuration / sections.length;
    let currentTime = 0;

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const sectionDuration = timePerSection;

      syncEngine.addSyncPoint(
        currentTime,
        currentTime,
        'start',
        {
          sectionIndex: i,
          title: section.title,
          animationType: section.animationType || 'fade-in',
        }
      );

      if (section.keywords && section.keywords.length > 0) {
        const keywordTime = currentTime + sectionDuration * 0.3;
        syncEngine.addSyncPoint(
          keywordTime,
          keywordTime,
          'highlight',
          {
            keywords: section.keywords,
          }
        );
      }

      if (i < sections.length - 1) {
        const transitionTime = currentTime + sectionDuration - 0.5;
        syncEngine.addSyncPoint(
          transitionTime,
          transitionTime,
          'transition',
          {
            fromSection: i,
            toSection: i + 1,
          }
        );
      }

      currentTime += sectionDuration;
    }

    if (capsule.interactiveElements) {
      for (const element of capsule.interactiveElements) {
        if (element.type === 'quiz' || element.type === 'poll') {
          const markerTime = (element.position || 0.5) * totalDuration;
          const title = (element as any).question || (element as any).title || 'Interactive Element';
          syncEngine.addMarker(
            title,
            markerTime,
            markerTime + 5,
            `interactive-${element.type}`
          );
        }
      }
    }

    return syncEngine.exportSyncData();
  }

  /**
   * Process with custom narration
   */
  async processWithCustomNarration(
    narrationText: string,
    capsule: CapsuleData
  ): Promise<TTSPipelineResult> {
    const startTime = Date.now();

    try {
      console.log('[TTS Pipeline] Processing with custom narration');

      const ttsResult = await this.config.ttsService.synthesizeSpeech(
        narrationText,
        this.config.defaultLanguage || 'fr-FR',
        this.config.defaultVoiceGender || 'FEMALE',
        this.config.options
      );

      const syncData = this.generateSyncPoints(capsule, ttsResult.duration);

      this.processingTime = Date.now() - startTime;

      return {
        audioUrl: ttsResult.audioUrl,
        audioBuffer: ttsResult.audioBuffer,
        duration: ttsResult.duration,
        syncData,
        metadata: {
          textLength: narrationText.length,
          wordCount: ttsResult.wordCount,
          segmentCount: capsule.contentStructure?.sections?.length || 1,
          processingTime: this.processingTime,
        },
      };
    } catch (error) {
      console.error('[TTS Pipeline] Custom narration error:', error);
      throw error;
    }
  }

  /**
   * Get processing statistics
   */
  getStats(): {
    lastProcessingTime: number;
  } {
    return {
      lastProcessingTime: this.processingTime,
    };
  }
}

/**
 * Create TTS pipeline
 */
export function createTTSPipeline(config: TTSPipelineConfig): TTSVideoPipeline {
  return new TTSVideoPipeline(config);
}
