/**
 * Interactive Elements Components for Remotion
 * Reusable components for quiz, polls, and other interactive elements
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig } from 'remotion';

export interface QuizElementProps {
  question: string;
  options?: string[];
  correctAnswer?: number;
  duration: number;
  showAnswer?: boolean;
}

export interface PollElementProps {
  question: string;
  options: string[];
  results?: number[];
  duration: number;
}

export interface CallToActionProps {
  text: string;
  buttonText: string;
  duration: number;
}

/**
 * Quiz Element Component
 */
export const QuizElement: React.FC<QuizElementProps> = ({
  question,
  options = [],
  correctAnswer = 0,
  duration,
  showAnswer = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalFrames = duration * fps;

  // Fade in effect
  const opacity = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Fade out effect
  const opacityOut = interpolate(
    frame,
    [totalFrames - fps * 0.5, totalFrames],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Scale animation for question
  const questionScale = interpolate(
    frame,
    [0, fps * 0.8],
    [0.9, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return (
    <AbsoluteFill
      style={{
        opacity: Math.min(opacity, opacityOut),
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px',
        textAlign: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Question */}
      <h2
        style={{
          fontSize: 56,
          fontWeight: 'bold',
          color: 'white',
          margin: '0 0 50px 0',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          transform: `scale(${questionScale})`,
          textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          maxWidth: '90%',
        }}
      >
        {question}
      </h2>

      {/* Options */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          width: '100%',
          maxWidth: '600px',
        }}
      >
        {options.map((option, index) => {
          const optionDelay = (index + 1) * 0.2;
          const optionOpacity = interpolate(
            frame,
            [fps * optionDelay, fps * (optionDelay + 0.5)],
            [0, 1],
            {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }
          );

          const isCorrect = showAnswer && index === correctAnswer;
          const backgroundColor = isCorrect
            ? 'rgba(76, 175, 80, 0.8)'
            : 'rgba(255, 255, 255, 0.2)';

          return (
            <div
              key={index}
              style={{
                padding: '20px',
                backgroundColor,
                borderRadius: '10px',
                color: 'white',
                fontSize: 24,
                fontWeight: '500',
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                opacity: optionOpacity,
                border: isCorrect ? '3px solid #4CAF50' : 'none',
                transform: `translateX(${(1 - optionOpacity) * 50}px)`,
              }}
            >
              {option}
              {isCorrect && ' ✓'}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/**
 * Poll Element Component
 */
export const PollElement: React.FC<PollElementProps> = ({
  question,
  options,
  results = [],
  duration,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalFrames = duration * fps;

  // Fade in effect
  const opacity = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Fade out effect
  const opacityOut = interpolate(
    frame,
    [totalFrames - fps * 0.5, totalFrames],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Calculate percentages
  const total = results.reduce((a, b) => a + b, 0) || 1;
  const percentages = results.map((r) => (r / total) * 100);

  return (
    <AbsoluteFill
      style={{
        opacity: Math.min(opacity, opacityOut),
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px',
        textAlign: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Question */}
      <h2
        style={{
          fontSize: 56,
          fontWeight: 'bold',
          color: 'white',
          margin: '0 0 50px 0',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        {question}
      </h2>

      {/* Poll Results */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '30px',
          width: '100%',
          maxWidth: '700px',
        }}
      >
        {options.map((option, index) => {
          const barWidth = interpolate(
            frame,
            [fps * 0.5, fps * 1.5],
            [0, percentages[index] || 0],
            {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }
          );

          return (
            <div key={index}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                  color: 'white',
                  fontSize: 20,
                  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                }}
              >
                <span>{option}</span>
                <span>{Math.round(percentages[index] || 0)}%</span>
              </div>
              <div
                style={{
                  height: '30px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '15px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    backgroundColor: `hsl(${index * 60}, 100%, 50%)`,
                    width: `${barWidth}%`,
                    transition: 'width 0.1s ease-out',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/**
 * Call to Action Component
 */
export const CallToAction: React.FC<CallToActionProps> = ({
  text,
  buttonText,
  duration,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalFrames = duration * fps;

  // Fade in effect
  const opacity = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Fade out effect
  const opacityOut = interpolate(
    frame,
    [totalFrames - fps * 0.5, totalFrames],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Button pulse animation
  const buttonScale = interpolate(
    (frame % (fps * 1)) / (fps * 1),
    [0, 0.5, 1],
    [1, 1.05, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return (
    <AbsoluteFill
      style={{
        opacity: Math.min(opacity, opacityOut),
        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px',
        textAlign: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Text */}
      <p
        style={{
          fontSize: 48,
          color: 'white',
          margin: '0 0 50px 0',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          maxWidth: '90%',
        }}
      >
        {text}
      </p>

      {/* Button */}
      <button
        style={{
          padding: '20px 60px',
          fontSize: 32,
          fontWeight: 'bold',
          color: '#4facfe',
          backgroundColor: 'white',
          border: 'none',
          borderRadius: '50px',
          cursor: 'pointer',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          transform: `scale(${buttonScale})`,
          boxShadow: '0 6px 30px rgba(0, 0, 0, 0.3)',
        }}
      >
        {buttonText}
      </button>
    </AbsoluteFill>
  );
};

/**
 * Highlight Box Component
 */
export interface HighlightBoxProps {
  title: string;
  content: string;
  duration: number;
  backgroundColor?: string;
}

export const HighlightBox: React.FC<HighlightBoxProps> = ({
  title,
  content,
  duration,
  backgroundColor = 'rgba(255, 255, 255, 0.15)',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalFrames = duration * fps;

  // Fade in effect
  const opacity = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Fade out effect
  const opacityOut = interpolate(
    frame,
    [totalFrames - fps * 0.5, totalFrames],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Scale animation
  const scale = interpolate(
    frame,
    [0, fps * 0.8],
    [0.95, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return (
    <div
      style={{
        opacity: Math.min(opacity, opacityOut),
        backgroundColor,
        padding: '40px',
        borderRadius: '20px',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        transform: `scale(${scale})`,
        maxWidth: '600px',
        textAlign: 'center',
      }}
    >
      <h3
        style={{
          fontSize: 32,
          fontWeight: 'bold',
          color: 'white',
          margin: '0 0 20px 0',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: 24,
          color: 'rgba(255, 255, 255, 0.9)',
          margin: 0,
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          lineHeight: 1.6,
        }}
      >
        {content}
      </p>
    </div>
  );
};
