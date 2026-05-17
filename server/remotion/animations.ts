/**
 * Animation Utilities for Remotion
 * Reusable animation functions and transitions
 */

import { interpolate } from 'remotion';

/**
 * Easing functions for smooth animations
 */
export const easing = {
  // Ease in/out functions
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => 1 - (1 - t) * (1 - t),
  easeInOutQuad: (t: number) =>
    t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,

  easeInQuart: (t: number) => t * t * t * t,
  easeOutQuart: (t: number) => 1 - Math.pow(1 - t, 4),
  easeInOutQuart: (t: number) =>
    t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,

  easeInQuint: (t: number) => t * t * t * t * t,
  easeOutQuint: (t: number) => 1 - Math.pow(1 - t, 5),
  easeInOutQuint: (t: number) =>
    t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2,

  easeInExpo: (t: number) =>
    t === 0 ? 0 : Math.pow(2, 10 * t - 10),
  easeOutExpo: (t: number) =>
    t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: (t: number) =>
    t === 0
      ? 0
      : t === 1
        ? 1
        : t < 0.5
          ? Math.pow(2, 20 * t - 10) / 2
          : (2 - Math.pow(2, -20 * t + 10)) / 2,

  easeInCirc: (t: number) =>
    1 - Math.sqrt(1 - Math.pow(t, 2)),
  easeOutCirc: (t: number) =>
    Math.sqrt(1 - Math.pow(t - 1, 2)),
  easeInOutCirc: (t: number) =>
    t < 0.5
      ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
      : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,
};

/**
 * Slide in from left animation
 */
export function slideInFromLeft(
  frame: number,
  fps: number,
  duration: number = 0.5
) {
  const totalFrames = duration * fps;
  return interpolate(frame, [0, totalFrames], [-100, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

/**
 * Slide in from right animation
 */
export function slideInFromRight(
  frame: number,
  fps: number,
  duration: number = 0.5
) {
  const totalFrames = duration * fps;
  return interpolate(frame, [0, totalFrames], [100, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

/**
 * Slide in from top animation
 */
export function slideInFromTop(
  frame: number,
  fps: number,
  duration: number = 0.5
) {
  const totalFrames = duration * fps;
  return interpolate(frame, [0, totalFrames], [-100, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

/**
 * Slide in from bottom animation
 */
export function slideInFromBottom(
  frame: number,
  fps: number,
  duration: number = 0.5
) {
  const totalFrames = duration * fps;
  return interpolate(frame, [0, totalFrames], [100, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

/**
 * Fade in animation
 */
export function fadeIn(
  frame: number,
  fps: number,
  duration: number = 0.5,
  delay: number = 0
) {
  const totalFrames = duration * fps;
  const delayFrames = delay * fps;
  return interpolate(frame, [delayFrames, delayFrames + totalFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

/**
 * Fade out animation
 */
export function fadeOut(
  frame: number,
  fps: number,
  duration: number = 0.5,
  delay: number = 0,
  totalFrames: number = Infinity
) {
  const fadeDuration = duration * fps;
  const delayFrames = delay * fps;
  const fadeStartFrame = totalFrames - fadeDuration - delayFrames;

  return interpolate(
    frame,
    [fadeStartFrame, fadeStartFrame + fadeDuration],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );
}

/**
 * Scale animation (zoom in)
 */
export function scaleIn(
  frame: number,
  fps: number,
  duration: number = 0.5,
  startScale: number = 0.8
) {
  const totalFrames = duration * fps;
  return interpolate(frame, [0, totalFrames], [startScale, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

/**
 * Scale animation (zoom out)
 */
export function scaleOut(
  frame: number,
  fps: number,
  duration: number = 0.5,
  endScale: number = 0.8,
  totalFrames: number = Infinity
) {
  const scaleDuration = duration * fps;
  const scaleStartFrame = totalFrames - scaleDuration;

  return interpolate(
    frame,
    [scaleStartFrame, totalFrames],
    [1, endScale],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );
}

/**
 * Rotate animation
 */
export function rotate(
  frame: number,
  fps: number,
  duration: number = 1,
  startDegrees: number = 0,
  endDegrees: number = 360
) {
  const totalFrames = duration * fps;
  return interpolate(
    frame,
    [0, totalFrames],
    [startDegrees, endDegrees],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );
}

/**
 * Pulse animation
 */
export function pulse(
  frame: number,
  fps: number,
  duration: number = 1,
  minScale: number = 0.95,
  maxScale: number = 1.05
) {
  const totalFrames = duration * fps;
  const progress = (frame % totalFrames) / totalFrames;

  if (progress < 0.5) {
    return minScale + (maxScale - minScale) * (progress * 2);
  } else {
    return maxScale - (maxScale - minScale) * ((progress - 0.5) * 2);
  }
}

/**
 * Bounce animation
 */
export function bounce(
  frame: number,
  fps: number,
  duration: number = 1,
  height: number = 100
) {
  const totalFrames = duration * fps;
  const progress = (frame % totalFrames) / totalFrames;

  // Simplified bounce using sine wave
  const bounceHeight =
    Math.sin(progress * Math.PI) * height * (1 - progress * 0.3);
  return bounceHeight;
}

/**
 * Shake animation
 */
export function shake(
  frame: number,
  fps: number,
  duration: number = 0.5,
  intensity: number = 10
) {
  const totalFrames = duration * fps;
  const progress = frame / totalFrames;

  if (progress > 1) return 0;

  // Random-like shake using sine waves
  const shake1 = Math.sin(frame * 0.3) * intensity;
  const shake2 = Math.sin(frame * 0.5) * intensity * 0.7;
  const damping = 1 - progress;

  return (shake1 + shake2) * damping;
}

/**
 * Typewriter effect (text reveal)
 */
export function typewriter(
  frame: number,
  fps: number,
  totalCharacters: number,
  duration: number
) {
  const totalFrames = duration * fps;
  const progress = Math.min(frame / totalFrames, 1);
  return Math.floor(progress * totalCharacters);
}

/**
 * Parallax effect
 */
export function parallax(
  frame: number,
  fps: number,
  speed: number = 0.5,
  maxOffset: number = 100
) {
  return Math.min((frame / fps) * speed, maxOffset);
}

/**
 * Combined fade and slide animation
 */
export function fadeAndSlide(
  frame: number,
  fps: number,
  direction: 'left' | 'right' | 'top' | 'bottom' = 'left',
  duration: number = 0.5
) {
  const totalFrames = duration * fps;

  const slideAmount =
    direction === 'left'
      ? slideInFromLeft(frame, fps, duration)
      : direction === 'right'
        ? slideInFromRight(frame, fps, duration)
        : direction === 'top'
          ? slideInFromTop(frame, fps, duration)
          : slideInFromBottom(frame, fps, duration);

  const opacity = fadeIn(frame, fps, duration);

  return {
    opacity,
    translateX: direction === 'left' || direction === 'right' ? slideAmount : 0,
    translateY: direction === 'top' || direction === 'bottom' ? slideAmount : 0,
  };
}

/**
 * Stagger animation for multiple elements
 */
export function stagger(
  frame: number,
  fps: number,
  index: number,
  staggerDelay: number = 0.1,
  duration: number = 0.5
) {
  const delayFrames = index * staggerDelay * fps;
  return fadeIn(frame, fps, duration, delayFrames);
}

/**
 * Create a spring-like animation
 */
export function spring(
  frame: number,
  fps: number,
  tension: number = 0.1,
  friction: number = 0.5
) {
  const t = frame / fps;
  const omega = Math.sqrt(tension);
  const dampedOmega = omega * Math.sqrt(1 - friction * friction);

  return (
    Math.exp(-friction * omega * t) *
    Math.cos(dampedOmega * t + Math.acos(friction))
  );
}

/**
 * Combine multiple animations
 */
export function combineAnimations(
  animations: Array<{
    value: number;
    weight?: number;
  }>
) {
  const totalWeight = animations.reduce((sum, a) => sum + (a.weight || 1), 0);

  return animations.reduce((sum, a) => {
    return sum + a.value * ((a.weight || 1) / totalWeight);
  }, 0);
}
