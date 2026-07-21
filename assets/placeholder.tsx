import type { FC } from "react";
import { COLORS } from "../remotion/style/whiteboard_v1";
import { AssetCanvas, type AssetProps, InkStroke } from "./shared";

/**
 * Visible fallback for an asset requested by a storyboard but not present in
 * the starter library. It deliberately remains in the approved ink language.
 */
export const Placeholder: FC<AssetProps> = ({ accent, className }) => {
  return (
    <AssetCanvas
      className={className}
      label="Missing asset placeholder"
      style={{ left: "40%", top: "40%", width: "20%" }}
      viewBox="0 0 280 180"
    >
      <InkStroke
        color={COLORS.ink}
        d="M16 16 L264 16 L264 164 L16 164 Z"
        dashPattern="15 11"
        length={792}
        width={6}
      />
      <InkStroke color={accent} d="M83 98 L115 66 L148 98 L180 66 L212 98" length={185} startF={5} width={7} />
      <text
        fill={COLORS.ink}
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="30"
        fontWeight="700"
        textAnchor="middle"
        x="140"
        y="139"
      >
        asset
      </text>
    </AssetCanvas>
  );
};
