import type { FC } from "react";
import { AssetCanvas, type AssetProps, InkStroke } from "../shared";

export const Arrow: FC<AssetProps> = ({ accent, className }) => {
  return (
    <AssetCanvas
      className={className}
      label="Directional arrow"
      style={{ left: "48%", top: "17%", width: "18%" }}
      viewBox="0 0 300 160"
    >
      <InkStroke color={accent} d="M26 80 C98 80 145 80 238 80 M190 31 L240 80 L190 129" length={330} width={11} />
    </AssetCanvas>
  );
};
