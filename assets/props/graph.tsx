import type { FC } from "react";
import { AssetCanvas, type AssetProps, InkStroke } from "../shared";

export const Graph: FC<AssetProps> = ({ accent, className }) => {
  return (
    <AssetCanvas
      className={className}
      label="Rising graph"
      style={{ left: "65%", top: "53%", width: "22%" }}
      viewBox="0 0 320 240"
    >
      <InkStroke d="M44 20 L44 202 L294 202" length={432} />
      <InkStroke color={accent} d="M65 171 L124 132 L168 153 L252 68 M220 71 L252 68 L247 100" length={360} startF={4} width={9} />
      <InkStroke d="M83 202 L83 188 M126 202 L126 188 M169 202 L169 188 M212 202 L212 188" length={56} startF={8} width={5} />
    </AssetCanvas>
  );
};
