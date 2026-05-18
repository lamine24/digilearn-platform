/**
 * Audio-Video Synchronization Engine
 * Synchronizes audio narration with video animations and transitions
 */

export interface AudioMarker {
  text: string;
  startTime: number;
  endTime: number;
  animationTrigger?: string;
}

export interface SyncPoint {
  audioTime: number;
  videoTime: number;
  action: 'start' | 'pause' | 'resume' | 'transition' | 'highlight';
  metadata?: Record<string, any>;
}

export interface AudioVideoSync {
  audioUrl: string;
  duration: number;
  syncPoints: SyncPoint[];
  markers: AudioMarker[];
}

/**
 * Audio-Video Synchronization Engine
 */
export class AudioSyncEngine {
  private syncPoints: SyncPoint[] = [];
  private markers: AudioMarker[] = [];
  private currentTime: number = 0;

  /**
   * Add sync point
   */
  addSyncPoint(
    audioTime: number,
    videoTime: number,
    action: 'start' | 'pause' | 'resume' | 'transition' | 'highlight',
    metadata?: Record<string, any>
  ): void {
    this.syncPoints.push({
      audioTime,
      videoTime,
      action,
      metadata,
    });

    this.syncPoints.sort((a, b) => a.audioTime - b.audioTime);
    console.log(`[Sync] Added sync point: ${action} at ${audioTime.toFixed(2)}s`);
  }

  /**
   * Add audio marker
   */
  addMarker(text: string, startTime: number, endTime: number, animationTrigger?: string): void {
    this.markers.push({
      text,
      startTime,
      endTime,
      animationTrigger,
    });

    this.markers.sort((a, b) => a.startTime - b.startTime);
    console.log(`[Sync] Added marker: "${text}" (${startTime.toFixed(2)}s - ${endTime.toFixed(2)}s)`);
  }

  /**
   * Generate sync points from audio segments
   */
  generateSyncPointsFromSegments(
    segments: Array<{
      text: string;
      duration: number;
      animationType?: string;
    }>,
    options?: {
      transitionDuration?: number;
      pauseBeforeSegment?: number;
    }
  ): SyncPoint[] {
    const syncPoints: SyncPoint[] = [];
    let currentTime = 0;
    const transitionDuration = options?.transitionDuration || 0.5;
    const pauseBeforeSegment = options?.pauseBeforeSegment || 0;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      // Pause before segment
      if (pauseBeforeSegment > 0 && i > 0) {
        syncPoints.push({
          audioTime: currentTime,
          videoTime: currentTime,
          action: 'pause',
          metadata: { duration: pauseBeforeSegment },
        });
        currentTime += pauseBeforeSegment;
      }

      // Start animation
      syncPoints.push({
        audioTime: currentTime,
        videoTime: currentTime,
        action: 'start',
        metadata: {
          animationType: segment.animationType || 'fade-in',
          segmentIndex: i,
        },
      });

      // Transition to next segment
      if (i < segments.length - 1) {
        const transitionTime = currentTime + segment.duration - transitionDuration;
        syncPoints.push({
          audioTime: transitionTime,
          videoTime: transitionTime,
          action: 'transition',
          metadata: {
            fromSegment: i,
            toSegment: i + 1,
            duration: transitionDuration,
          },
        });
      }

      currentTime += segment.duration;
    }

    this.syncPoints = syncPoints;
    return syncPoints;
  }

  /**
   * Generate sync points from text with natural pauses
   */
  generateSyncPointsFromText(
    text: string,
    audioStartTime: number = 0,
    options?: {
      sentenceBreakDuration?: number;
      paragraphBreakDuration?: number;
      highlightKeywords?: string[];
    }
  ): SyncPoint[] {
    const syncPoints: SyncPoint[] = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const sentenceBreakDuration = options?.sentenceBreakDuration || 0.3;
    const paragraphBreakDuration = options?.paragraphBreakDuration || 0.5;
    const highlightKeywords = options?.highlightKeywords || [];

    let currentTime = audioStartTime;
    const avgWordsPerSecond = 2.5;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      const wordCount = sentence.split(/\s+/).length;
      const sentenceDuration = wordCount / avgWordsPerSecond;

      // Start sentence
      syncPoints.push({
        audioTime: currentTime,
        videoTime: currentTime,
        action: 'start',
        metadata: {
          type: 'sentence',
          text: sentence,
          index: i,
        },
      });

      // Highlight keywords
      for (const keyword of highlightKeywords) {
        if (sentence.toLowerCase().includes(keyword.toLowerCase())) {
          const keywordPosition = sentence.toLowerCase().indexOf(keyword.toLowerCase());
          const keywordTime = currentTime + (keywordPosition / sentence.length) * sentenceDuration;

          syncPoints.push({
            audioTime: keywordTime,
            videoTime: keywordTime,
            action: 'highlight',
            metadata: {
              keyword,
              duration: 0.5,
            },
          });
        }
      }

      currentTime += sentenceDuration;

      // Add break between sentences
      if (i < sentences.length - 1) {
        const breakDuration =
          (i + 1) % 3 === 0 ? paragraphBreakDuration : sentenceBreakDuration;
        syncPoints.push({
          audioTime: currentTime,
          videoTime: currentTime,
          action: 'pause',
          metadata: { duration: breakDuration },
        });
        currentTime += breakDuration;
      }
    }

    this.syncPoints = syncPoints;
    return syncPoints;
  }

  /**
   * Get sync points for a time range
   */
  getSyncPointsInRange(startTime: number, endTime: number): SyncPoint[] {
    return this.syncPoints.filter((sp) => sp.audioTime >= startTime && sp.audioTime <= endTime);
  }

  /**
   * Get next sync point
   */
  getNextSyncPoint(currentTime: number): SyncPoint | null {
    return this.syncPoints.find((sp) => sp.audioTime > currentTime) || null;
  }

  /**
   * Get previous sync point
   */
  getPreviousSyncPoint(currentTime: number): SyncPoint | null {
    const previous = this.syncPoints.filter((sp) => sp.audioTime < currentTime);
    return previous.length > 0 ? previous[previous.length - 1] : null;
  }

  /**
   * Calculate video time from audio time
   */
  calculateVideoTime(audioTime: number): number {
    let videoTime = audioTime;

    for (const syncPoint of this.syncPoints) {
      if (syncPoint.audioTime > audioTime) break;

      if (syncPoint.action === 'pause' && syncPoint.metadata?.duration) {
        videoTime += syncPoint.metadata.duration;
      }
    }

    return videoTime;
  }

  /**
   * Create animation timeline
   */
  createAnimationTimeline(
    duration: number,
    fps: number = 30
  ): Array<{
    frame: number;
    time: number;
    syncPoint?: SyncPoint;
  }> {
    const timeline = [];
    const frameCount = Math.ceil(duration * fps);
    const frameDuration = 1 / fps;

    for (let frame = 0; frame < frameCount; frame++) {
      const time = frame * frameDuration;
      const syncPoint = this.syncPoints.find((sp) => Math.abs(sp.videoTime - time) < frameDuration);

      timeline.push({
        frame,
        time,
        syncPoint,
      });
    }

    return timeline;
  }

  /**
   * Export sync data as JSON
   */
  exportSyncData(): AudioVideoSync {
    return {
      audioUrl: '',
      duration: this.syncPoints.length > 0 ? this.syncPoints[this.syncPoints.length - 1].audioTime : 0,
      syncPoints: this.syncPoints,
      markers: this.markers,
    };
  }

  /**
   * Import sync data from JSON
   */
  importSyncData(data: AudioVideoSync): void {
    this.syncPoints = data.syncPoints;
    this.markers = data.markers;
    console.log(`[Sync] Imported ${this.syncPoints.length} sync points and ${this.markers.length} markers`);
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalSyncPoints: number;
    totalMarkers: number;
    duration: number;
    syncPointsByAction: Record<string, number>;
  } {
    const syncPointsByAction: Record<string, number> = {};

    for (const syncPoint of this.syncPoints) {
      syncPointsByAction[syncPoint.action] = (syncPointsByAction[syncPoint.action] || 0) + 1;
    }

    return {
      totalSyncPoints: this.syncPoints.length,
      totalMarkers: this.markers.length,
      duration: this.syncPoints.length > 0 ? this.syncPoints[this.syncPoints.length - 1].audioTime : 0,
      syncPointsByAction,
    };
  }

  /**
   * Validate sync data
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for overlapping markers
    for (let i = 0; i < this.markers.length - 1; i++) {
      const current = this.markers[i];
      const next = this.markers[i + 1];

      if (current.endTime > next.startTime) {
        errors.push(`Markers overlap: "${current.text}" and "${next.text}"`);
      }
    }

    // Check for sync points order
    for (let i = 0; i < this.syncPoints.length - 1; i++) {
      if (this.syncPoints[i].audioTime > this.syncPoints[i + 1].audioTime) {
        errors.push('Sync points are not in order');
        break;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.syncPoints = [];
    this.markers = [];
    this.currentTime = 0;
    console.log('[Sync] Cleared all sync data');
  }
}

/**
 * Global sync engine instance
 */
let globalSyncEngine: AudioSyncEngine | null = null;

/**
 * Get or create global sync engine
 */
export function getSyncEngine(): AudioSyncEngine {
  if (!globalSyncEngine) {
    globalSyncEngine = new AudioSyncEngine();
  }
  return globalSyncEngine;
}

/**
 * Create new sync engine
 */
export function createSyncEngine(): AudioSyncEngine {
  return new AudioSyncEngine();
}
