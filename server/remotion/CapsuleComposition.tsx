import React from "react";
import { Composition, Sequence, useVideoConfig, AbsoluteFill, Img, useCurrentFrame, interpolate } from "remotion";

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

// Slide Component for each section
const Slide: React.FC<{
  title: string;
  content: string;
  duration: number;
}> = ({ title, content, duration }) => {
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
      }}
    >
      <h1
        style={{
          fontSize: 72,
          fontWeight: "bold",
          color: "white",
          margin: "0 0 30px 0",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {title}
      </h1>
      <p
        style={{
          fontSize: 36,
          color: "rgba(255, 255, 255, 0.9)",
          margin: 0,
          fontFamily: "Arial, sans-serif",
          lineHeight: 1.6,
          maxWidth: "90%",
        }}
      >
        {content}
      </p>
    </AbsoluteFill>
  );
};

// Title Slide
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
      }}
    >
      <h1
        style={{
          fontSize: 96,
          fontWeight: "bold",
          color: "white",
          margin: "0 0 40px 0",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {title}
      </h1>
      <p
        style={{
          fontSize: 40,
          color: "rgba(255, 255, 255, 0.8)",
          margin: 0,
          fontFamily: "Arial, sans-serif",
          lineHeight: 1.6,
          maxWidth: "85%",
        }}
      >
        {description}
      </p>
    </AbsoluteFill>
  );
};

// End Slide
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
      }}
    >
      <h1
        style={{
          fontSize: 80,
          fontWeight: "bold",
          color: "white",
          margin: 0,
          fontFamily: "Arial, sans-serif",
        }}
      >
        Merci d'avoir regardé !
      </h1>
      <p
        style={{
          fontSize: 40,
          color: "rgba(255, 255, 255, 0.8)",
          margin: "30px 0 0 0",
          fontFamily: "Arial, sans-serif",
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

  let currentFrame = 0;
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
        const frameStart = (titleDuration + sections.slice(0, index).reduce((acc, s) => acc + (s.duration || defaultSectionDuration), 0)) * fps;
        
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
