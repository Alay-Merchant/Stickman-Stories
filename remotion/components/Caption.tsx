import type { CSSProperties, FC } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../style/whiteboard_v1";

export type CaptionProps = {
  text: string;
  accent: string;
  placement?: "top" | "bottom";
};

/**
 * A legible burn-in caption. It intentionally uses a clean sans-serif rather
 * than the marker title style, and sits above the platform-overlay safe area.
 */
export const Caption: FC<CaptionProps> = ({ text, accent, placement = "bottom" }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const portrait = height > width;
  const enter = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fontSize = portrait ? Math.round(width * 0.053) : Math.round(width * 0.029);
  const verticalPlacement: CSSProperties =
    placement === "top"
      ? { top: portrait ? Math.round(height * 0.1) : Math.round(height * 0.08) }
      : { bottom: portrait ? Math.round(height * 0.15) : Math.round(height * 0.07) };
  const style: CSSProperties = {
    position: "absolute",
    left: portrait ? "8%" : "12%",
    right: portrait ? "8%" : "12%",
    color: COLORS.ink,
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize,
    fontWeight: 800,
    letterSpacing: "-0.02em",
    lineHeight: 1.12,
    textAlign: "center",
    transform: "translateY(" + Math.round((1 - enter) * 20) + "px) scale(" + (0.97 + enter * 0.03) + ")",
    transformOrigin: "center bottom",
    opacity: enter,
    ...verticalPlacement,
  };

  return (
    <div aria-label={text} style={style}>
      <span
        style={{
          backgroundColor: COLORS.boardWhite,
          borderBottom: "6px solid " + accent,
          boxDecorationBreak: "clone",
          padding: "0.08em 0.2em",
          WebkitBoxDecorationBreak: "clone",
        }}
      >
        {text}
      </span>
    </div>
  );
};
