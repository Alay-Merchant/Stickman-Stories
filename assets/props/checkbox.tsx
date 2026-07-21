import type { FC } from "react";
import { AssetCanvas, type AssetProps, InkStroke } from "../shared";

export const Checkbox: FC<AssetProps> = ({ accent, className }) => {
  return (
    <AssetCanvas
      className={className}
      label="Checklist"
      style={{ left: "8%", top: "20%", width: "17%" }}
      viewBox="0 0 280 250"
    >
      <InkStroke d="M22 24 L78 24 L78 80 L22 80 Z M22 102 L78 102 L78 158 L22 158 Z M22 180 L78 180 L78 236 L22 236 Z" length={672} />
      <InkStroke color={accent} d="M33 51 L47 65 L69 38 M33 129 L47 143 L69 116" length={110} startF={4} width={7} />
      <InkStroke d="M104 52 L254 52 M104 130 L254 130 M104 208 L232 208" length={428} startF={7} width={7} />
    </AssetCanvas>
  );
};
