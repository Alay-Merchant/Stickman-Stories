import type { FC } from "react";
import { AssetCanvas, type AssetProps, InkStroke } from "../shared";

export const Clock: FC<AssetProps> = ({ accent, className }) => {
  return (
    <AssetCanvas
      className={className}
      label="Clock"
      style={{ left: "70%", top: "68%", width: "13%" }}
      viewBox="0 0 220 250"
    >
      <InkStroke d="M110 38 A78 78 0 1 1 109.9 38 M82 18 L138 18 M110 18 L110 1" length={620} />
      <InkStroke color={accent} d="M110 116 L110 69 M110 116 L151 139" length={98} startF={4} width={9} />
      <InkStroke d="M110 38 L110 49 M188 116 L177 116 M110 194 L110 183 M32 116 L43 116" length={44} startF={8} width={5} />
    </AssetCanvas>
  );
};
