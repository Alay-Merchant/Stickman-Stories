import type { FC } from "react";
import { COLORS } from "../../remotion/style/whiteboard_v1";
import { AssetCanvas, type AssetProps, InkStroke } from "../shared";

export const BlankBoard: FC<AssetProps> = ({ accent, className }) => {
  return (
    <AssetCanvas
      className={className}
      label="Blank whiteboard"
      style={{ height: "100%", inset: 0, width: "100%" }}
      viewBox="0 0 1000 1000"
    >
      <rect fill={COLORS.boardWhite} height="1000" width="1000" x="0" y="0" />
      <InkStroke color={COLORS.charcoal} d="M58 92 L942 92" durF={18} length={884} width={3} />
      <InkStroke color={accent} d="M74 130 L155 130" durF={10} length={81} startF={5} width={6} />
    </AssetCanvas>
  );
};
