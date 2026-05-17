/**
 * Remotion Capsule Video Component
 * Wrapper component for rendering capsule videos
 */

import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CapsuleComposition } from './CapsuleComposition';
import type { CapsuleData } from '../video-generation';

export interface CapsuleVideoProps {
  data: CapsuleData;
  durationInFrames: number;
  fps: number;
}

/**
 * Main video component that wraps the capsule composition
 */
export const CapsuleVideo: React.FC<CapsuleVideoProps> = ({
  data,
  durationInFrames,
  fps,
}) => {
  return (
    <AbsoluteFill>
      <CapsuleComposition
        data={data}
        durationInFrames={durationInFrames}
        fps={fps}
      />
    </AbsoluteFill>
  );
};

export default CapsuleVideo;
