import type { CSSProperties, FC, ReactNode } from "react";
import { StrokePath } from "../remotion/components/StrokePath";
import { COLORS, STROKE } from "../remotion/style/whiteboard_v1";

export type AssetProps = {
  accent: string;
  className?: string;
};

export type CharacterProps = AssetProps & {
  pose: string;
};

type AssetCanvasProps = {
  children: ReactNode;
  className?: string;
  label: string;
  style?: CSSProperties;
  viewBox?: string;
};

type InkStrokeProps = {
  d: string;
  length: number;
  color?: string;
  width?: number;
  startF?: number;
  durF?: number;
  dashPattern?: string;
};

/**
 * Individual assets position themselves with percentages, allowing the same
 * scene semantics to remain useful on both landscape and portrait canvases.
 */
export const AssetCanvas: FC<AssetCanvasProps> = ({
  children,
  className,
  label,
  style,
  viewBox = "0 0 300 300",
}) => {
  return (
    <svg
      aria-label={label}
      className={className}
      role="img"
      style={{
        height: "auto",
        overflow: "visible",
        position: "absolute",
        width: "20%",
        ...style,
      }}
      viewBox={viewBox}
    >
      {children}
    </svg>
  );
};

export const InkStroke: FC<InkStrokeProps> = ({
  d,
  length,
  color = COLORS.ink,
  width = STROKE,
  startF = 0,
  durF = 12,
  dashPattern,
}) => {
  return (
    <StrokePath
      color={color}
      dashPattern={dashPattern}
      d={d}
      durF={durF}
      length={length}
      startF={startF}
      width={width}
    />
  );
};
