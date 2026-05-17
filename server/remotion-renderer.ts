/**
 * Remotion Renderer - Validation and Duration Estimation
 * Validates capsule data and estimates video duration
 */

import type { CapsuleData, InteractiveElement, ContentSection } from './video-generation';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface DurationEstimate {
  baseDuration: number; // seconds
  contentDuration: number; // seconds
  narrationDuration: number; // seconds
  interactiveDuration: number; // seconds
  totalDuration: number; // seconds
}

/**
 * Validate capsule data structure
 */
export function validateCapsuleData(data: CapsuleData): ValidationResult {
  const errors: string[] = [];

  // Validate required fields
  if (!data.title || data.title.trim().length === 0) {
    errors.push('Title is required and cannot be empty');
  }

  if (data.title && data.title.length > 500) {
    errors.push('Title must be 500 characters or less');
  }

  if (!data.narrationText || data.narrationText.trim().length === 0) {
    errors.push('Narration text is required');
  }

  // Validate content structure if provided
  if (data.contentStructure) {
    if (data.contentStructure.sections && !Array.isArray(data.contentStructure.sections)) {
      errors.push('Content structure sections must be an array');
    }

    if (data.contentStructure.sections && data.contentStructure.sections.length === 0) {
      errors.push('At least one content section is recommended');
    }

    if (data.contentStructure.sections) {
      data.contentStructure.sections.forEach((section: ContentSection, index: number) => {
        if (!section.title || section.title.trim().length === 0) {
          errors.push(`Section ${index + 1} title is required`);
        }
        if (!section.content || section.content.trim().length === 0) {
          errors.push(`Section ${index + 1} content is required`);
        }
      });
    }
  }

  // Validate interactive elements if provided
  if (data.interactiveElements) {
    if (!Array.isArray(data.interactiveElements)) {
      errors.push('Interactive elements must be an array');
    } else {
      data.interactiveElements.forEach((element: InteractiveElement, index: number) => {
        if (!element.type || element.type.trim().length === 0) {
          errors.push(`Interactive element ${index + 1} type is required`);
        }
        if (!element.text || element.text.trim().length === 0) {
          errors.push(`Interactive element ${index + 1} text is required`);
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Estimate reading time from text
 * Assumes average reading speed of 200 words per minute
 */
function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  const readingSpeedWPM = 200;
  return (words / readingSpeedWPM) * 60; // Convert to seconds
}

/**
 * Estimate narration time from text
 * Assumes average speaking speed of 150 words per minute
 */
function estimateNarrationTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  const speakingSpeedWPM = 150;
  return (words / speakingSpeedWPM) * 60; // Convert to seconds
}

/**
 * Calculate content duration from structure
 */
function calculateContentDuration(contentStructure?: { sections?: ContentSection[] }): number {
  if (!contentStructure || !contentStructure.sections || contentStructure.sections.length === 0) {
    return 0;
  }

  return contentStructure.sections.reduce((total, section) => {
    // If section has explicit duration, use it
    if (section.duration && section.duration > 0) {
      return total + section.duration;
    }

    // Otherwise estimate from content length
    const estimatedDuration = estimateReadingTime(section.content);
    return total + estimatedDuration;
  }, 0);
}

/**
 * Calculate interactive elements duration
 */
function calculateInteractiveDuration(interactiveElements?: InteractiveElement[]): number {
  if (!interactiveElements || interactiveElements.length === 0) {
    return 0;
  }

  // Each interactive element adds ~5 seconds for user interaction
  return interactiveElements.length * 5;
}

/**
 * Estimate total video duration
 */
export function estimateCapsuleDuration(data: CapsuleData): number {
  // Base duration: intro (5s) + outro (3s)
  const baseDuration = 8;

  // Narration duration
  const narrationDuration = estimateNarrationTime(data.narrationText || '');

  // Content duration
  const contentDuration = calculateContentDuration(data.contentStructure);

  // Interactive elements duration
  const interactiveDuration = calculateInteractiveDuration(data.interactiveElements);

  // Description reading time (if provided)
  const descriptionDuration = data.description ? estimateReadingTime(data.description) * 0.5 : 0;

  // Total duration with buffer (add 10% for transitions and effects)
  const totalDuration = (baseDuration + narrationDuration + contentDuration + interactiveDuration + descriptionDuration) * 1.1;

  // Ensure minimum 30 seconds and maximum 30 minutes
  return Math.max(30, Math.min(totalDuration, 1800));
}

/**
 * Get detailed duration breakdown
 */
export function getDurationBreakdown(data: CapsuleData): DurationEstimate {
  const baseDuration = 8;
  const narrationDuration = estimateNarrationTime(data.narrationText || '');
  const contentDuration = calculateContentDuration(data.contentStructure);
  const interactiveDuration = calculateInteractiveDuration(data.interactiveElements);

  const totalDuration = estimateCapsuleDuration(data);

  return {
    baseDuration,
    contentDuration,
    narrationDuration,
    interactiveDuration,
    totalDuration,
  };
}

/**
 * Validate duration is within acceptable range
 */
export function validateDuration(durationSeconds: number): ValidationResult {
  const errors: string[] = [];

  if (durationSeconds < 30) {
    errors.push('Video duration must be at least 30 seconds');
  }

  if (durationSeconds > 1800) {
    errors.push('Video duration must not exceed 30 minutes');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }

  return `${secs}s`;
}
