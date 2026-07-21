import type { FC } from "react";
import { COLORS } from "../../remotion/style/whiteboard_v1";
import { AssetCanvas, type AssetProps, InkStroke } from "../shared";

export const Outdoor: FC<AssetProps> = ({ accent, className }) => {
  return (
    <AssetCanvas
      className={className}
      label="Whiteboard outdoor setting"
      style={{ height: "100%", inset: 0, width: "100%" }}
      viewBox="0 0 1000 1000"
    >
      <rect fill={COLORS.boardWhite} height="1000" width="1000" x="0" y="0" />
      <InkStroke color={COLORS.charcoal} d="M45 690 C210 628 340 728 500 676 C684 616 810 704 955 650" durF={18} length={950} width={6} />
      <InkStroke color={accent} d="M787 123 A72 72 0 1 1 786.9 123 M787 29 L787 2 M878 73 L903 48 M696 73 L671 48" durF={18} length={610} startF={3} width={7} />
      <InkStroke color={COLORS.charcoal} d="M142 690 L142 470 M142 537 L86 485 M142 515 L201 458 M855 670 L855 506 M855 546 L810 505 M855 528 L904 480" durF={20} length={950} startF={5} width={7} />
    </AssetCanvas>
  );
};
