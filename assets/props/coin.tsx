import type { FC } from "react";
import { AssetCanvas, type AssetProps, InkStroke } from "../shared";

export const Coin: FC<AssetProps> = ({ accent, className }) => {
  return (
    <AssetCanvas
      className={className}
      label="Coin"
      style={{ left: "15%", top: "66%", width: "12%" }}
      viewBox="0 0 220 220"
    >
      <InkStroke d="M110 20 A90 90 0 1 1 109.9 20" length={566} />
      <InkStroke color={accent} d="M110 55 L110 165 M137 78 C128 61 85 65 85 96 C85 128 140 105 140 139 C140 170 96 171 82 151" length={280} startF={4} width={8} />
    </AssetCanvas>
  );
};
