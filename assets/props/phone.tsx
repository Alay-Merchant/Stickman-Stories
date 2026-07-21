import type { FC } from "react";
import { AssetCanvas, type AssetProps, InkStroke } from "../shared";

export const Phone: FC<AssetProps> = ({ accent, className }) => {
  return (
    <AssetCanvas
      className={className}
      label="Phone"
      style={{ left: "70%", top: "38%", width: "13%" }}
      viewBox="0 0 180 300"
    >
      <InkStroke d="M28 12 Q16 12 16 28 L16 272 Q16 288 32 288 L148 288 Q164 288 164 272 L164 28 Q164 12 148 12 Z" length={820} />
      <InkStroke color={accent} d="M39 61 L141 61 L141 209 L39 209 Z" length={522} startF={4} width={6} />
      <InkStroke d="M76 249 L104 249" length={28} startF={8} width={7} />
    </AssetCanvas>
  );
};
