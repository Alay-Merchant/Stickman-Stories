import type { FC } from "react";
import { COLORS } from "../../remotion/style/whiteboard_v1";
import { AssetCanvas, type AssetProps, InkStroke } from "../shared";

export const Desk: FC<AssetProps> = ({ accent, className }) => {
  return (
    <AssetCanvas
      className={className}
      label="Whiteboard desk setting"
      style={{ height: "100%", inset: 0, width: "100%" }}
      viewBox="0 0 1000 1000"
    >
      <rect fill={COLORS.boardWhite} height="1000" width="1000" x="0" y="0" />
      <InkStroke color={COLORS.charcoal} d="M75 180 L925 180 M75 720 L925 720 M150 720 L118 930 M850 720 L882 930" durF={20} length={2350} width={6} />
      <InkStroke color={accent} d="M736 164 L836 164 L836 126" durF={12} length={138} startF={5} width={7} />
      <InkStroke color={COLORS.charcoal} d="M115 721 L260 643 L364 721" durF={14} length={330} startF={7} width={5} />
    </AssetCanvas>
  );
};
