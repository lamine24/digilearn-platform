import React from "react";
import {
  Composition,
  Sequence,
  useVideoConfig,
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
} from "remotion";

interface CapsuleData {
  title: string;
  description: string;
  contentStructure?: {
    sections?: Array<{
      title: string;
      content: string;
      duration?: number;
    }>;
  };
  interactiveElements?: Array<{
    type: string;
    text: string;
    position?: { x: number; y: number };
  }>;
  narrationText?: string;
}

interface CapsuleCompositionProps {
  data: CapsuleData;
  durationInFrames: number;
  fps: number;
}

// Animated background element
const AnimatedBackgroundElement: React.FC<{
  top: string;
  right?: string;
  left?: string;
  bottom?: string;
  size: number;
  duration: number;
  delay: number;
}> = ({ top, right, left, bottom, size, duration, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const floatOffset = interpolate(
    (frame + delay * fps) % (duration * fps),
    [0, duration * fps / 2, duration * fps],
    [0, -30, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (
    <div
      style={{
        position: "absolute",
        width: `${size}px`,
        height: `${size}px`,
        background: "rgba(255, 255, 255, 0.1)",
        borderRadius: "50%",
        top,
        right,
        left,
        bottom,
        transform: `translateY(${floatOffset}px)`,
        pointerEvents: "none",
      }}
    />
  );
};

// Slide Component for each section with advanced animations
const Slide: React.FC<{
  title: string;
  content: string;
  duration: number;
  index?: number;
}> = ({ title, content, duration, index = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalFrames = duration * fps;

  // Fade in effect
  const opacity = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade out effect
  const opacityOut = interpolate(
    frame,
    [totalFrames - fps * 0.5, totalFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Slide in animation for title
  const titleTranslateX = interpolate(
    frame,
    [0, fps * 0.8],
    [-100, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Slide in animation for content (delayed)
  const contentTranslateY = interpolate(
    frame,
    [fps * 0.3, fps * 1.2],
    [50, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Gradient animation
  const hueRotation = interpolate(
    frame,
    [0, totalFrames],
    [0, 30],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Background color variation based on index
  const colors = [
    { from: "#667eea", to: "#764ba2" },
    { from: "#f093fb", to: "#f5576c" },
    { from: "#4facfe", to: "#00f2fe" },
    { from: "#43e97b", to: "#38f9d7" },
    { from: "#fa709a", to: "#fee140" },
  ];
  const colorSet = colors[index % colors.length];

  return (
    <AbsoluteFill
      style={{
        opacity: Math.min(opacity, opacityOut),
        background: `linear-gradient(${135 + hueRotation}deg, ${colorSet.from} 0%, ${colorSet.to} 100%)`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "60px",
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      {/* Animated background elements */}
      <AnimatedBackgroundElement
        top="10%"
        right="10%"
        size={200}
        duration={6}
        delay={0}
      />
      <AnimatedBackgroundElement
        bottom="15%"
        left="5%"
        size={150}
        duration={8}
        delay={1}
      />
      <AnimatedBackgroundElement
        top="50%"
        right="5%"
        size={100}
        duration={7}
        delay={0.5}
      />

      {/* Title with slide-in animation */}
      <h1
        style={{
          fontSize: 72,
          fontWeight: "bold",
          color: "white",
          margin: "0 0 30px 0",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          transform: `translateX(${titleTranslateX}px)`,
          textShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
          letterSpacing: "1px",
          zIndex: 1,
          position: "relative",
        }}
      >
        {title}
      </h1>

      {/* Content with fade and slide animation */}
      <p
        style={{
          fontSize: 36,
          color: "rgba(255, 255, 255, 0.95)",
          margin: 0,
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          lineHeight: 1.8,
          maxWidth: "90%",
          transform: `translateY(${contentTranslateY}px)`,
          textShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
          zIndex: 1,
          position: "relative",
        }}
      >
        {content}
      </p>
    </AbsoluteFill>
  );
};

// Title Slide with zoom and fade animations
const TitleSlide: React.FC<{
  title: string;
  description: string;
  duration: number;
}> = ({ title, description, duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalFrames = duration * fps;

  const opacity = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const opacityOut = interpolate(
    frame,
    [totalFrames - fps * 0.5, totalFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Zoom in effect for title
  const titleScale = interpolate(
    frame,
    [0, fps * 0.8],
    [0.8, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Zoom in effect for description (delayed)
  const descriptionScale = interpolate(
    frame,
    [fps * 0.3, fps * 1],
    [0.9, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (
    <AbsoluteFill
      style={{
        opacity: Math.min(opacity, opacityOut),
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "60px",
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      {/* Animated background */}
      <AnimatedBackgroundElement
        top="20%"
        right="15%"
        size={300}
        duration={4}
        delay={0}
      />
      <AnimatedBackgroundElement
        bottom="20%"
        left="10%"
        size={250}
        duration={5}
        delay={0.5}
      />

      <h1
        style={{
          fontSize: 96,
          fontWeight: "bold",
          color: "white",
          margin: "0 0 40px 0",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          transform: `scale(${titleScale})`,
          textShadow: "0 6px 30px rgba(0, 0, 0, 0.4)",
          letterSpacing: "2px",
          zIndex: 1,
          position: "relative",
        }}
      >
        {title}
      </h1>
      <p
        style={{
          fontSize: 40,
          color: "rgba(255, 255, 255, 0.9)",
          margin: 0,
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          lineHeight: 1.6,
          maxWidth: "85%",
          transform: `scale(${descriptionScale})`,
          textShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
          zIndex: 1,
          position: "relative",
        }}
      >
        {description}
      </p>
    </AbsoluteFill>
  );
};

// End Slide with scale and fade animations
const EndSlide: React.FC<{ title: string; duration: number }> = ({
  title,
  duration,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalFrames = duration * fps;

  const opacity = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const opacityOut = interpolate(
    frame,
    [totalFrames - fps * 0.5, totalFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Scale animation
  const scale = interpolate(
    frame,
    [0, fps * 0.6],
    [0.9, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (
    <AbsoluteFill
      style={{
        opacity: Math.min(opacity, opacityOut),
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "60px",
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      {/* Animated confetti-like elements */}
      <AnimatedBackgroundElement
        top="10%"
        left="10%"
        size={100}
        duration={5}
        delay={0}
      />
      <AnimatedBackgroundElement
        bottom="15%"
        right="12%"
        size={80}
        duration={7}
        delay={0.3}
      />
      <AnimatedBackgroundElement
        top="40%"
        right="8%"
        size={120}
        duration={6}
        delay={0.6}
      />

      <h1
        style={{
          fontSize: 80,
          fontWeight: "bold",
          color: "white",
          margin: 0,
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          transform: `scale(${scale})`,
          textShadow: "0 6px 30px rgba(0, 0, 0, 0.4)",
          letterSpacing: "1px",
          zIndex: 1,
          position: "relative",
        }}
      >
        Merci d'avoir regardé !
      </h1>
      <p
        style={{
          fontSize: 40,
          color: "rgba(255, 255, 255, 0.9)",
          margin: "30px 0 0 0",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          transform: `scale(${scale})`,
          textShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
          zIndex: 1,
          position: "relative",
        }}
      >
        {title}
      </p>
    </AbsoluteFill>
  );
};

export const CapsuleComposition: React.FC<CapsuleCompositionProps> = ({
  data,
  durationInFrames,
  fps,
}) => {
  const sections = data.contentStructure?.sections || [];
  const defaultSectionDuration = 5; // 5 seconds per section

  const titleDuration = 3; // 3 seconds for title
  const endDuration = 2; // 2 seconds for end

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Title Slide */}
      <Sequence from={0} durationInFrames={titleDuration * fps}>
        <TitleSlide
          title={data.title}
          description={data.description}
          duration={titleDuration}
        />
      </Sequence>

      {/* Content Slides */}
      {sections.map((section, index) => {
        const sectionDuration = section.duration || defaultSectionDuration;
        const frameStart =
          (titleDuration +
            sections
              .slice(0, index)
              .reduce(
                (acc, s) => acc + (s.duration || defaultSectionDuration),
                0
              )) *
          fps;

        return (
          <Sequence
            key={index}
            from={frameStart}
            durationInFrames={sectionDuration * fps}
          >
            <Slide
              title={section.title}
              content={section.content}
              duration={sectionDuration}
              index={index}
            />
          </Sequence>
        );
      })}

      {/* End Slide */}
      <Sequence
        from={durationInFrames - endDuration * fps}
        durationInFrames={endDuration * fps}
      >
        <EndSlide title={data.title} duration={endDuration} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const remotionCompositions = [
  {
    id: "CapsuleComposition",
    component: CapsuleComposition,
    durationInFrames: 300,
    fps: 30,
    width: 1920,
    height: 1080,
  },
];
