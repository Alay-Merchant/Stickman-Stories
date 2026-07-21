import type { FC } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { easeOutCubic, STROKE } from "../style/whiteboard_v1";

export type StrokePathProps = {
  d: string;
  /**
   * Approximate path length. Hand-authored assets keep this explicit so the
   * dash animation is deterministic in the browser and the renderer.
   */
  length: number;
  startF?: number;
  durF?: number;
  color: string;
  width?: number;
  opacity?: number;
  dashPattern?: string;
};

/**
 * Draws a static SVG path as if a marker is revealing it. The path geometry
 * never changes between frames, which avoids flicker and keeps renders stable.
 */
export const StrokePath: FC<StrokePathProps> = ({
  d,
  length,
  startF = 0,
  durF = 12,
  color,
  width = STROKE,
  opacity = 1,
  dashPattern,
}) => {
  const frame = useCurrentFrame();
  const remaining = interpolate(frame, [startF, startF + Math.max(1, durF)], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOutCubic,
  });
  const safeLength = Math.max(1, length);

  return (
    <path
      d={d}
      fill="none"
      opacity={opacity}
      stroke={color}
      strokeDasharray={dashPattern ?? safeLength}
      strokeDashoffset={safeLength * remaining}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={width}
    />
  );
};
