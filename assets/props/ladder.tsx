import type { FC } from "react";
import { AssetCanvas, type AssetProps, InkStroke } from "../shared";

export const Ladder: FC<AssetProps> = ({ accent, className }) => {
  return (
    <AssetCanvas
      className={className}
      label="Ladder"
      style={{ left: "80%", top: "43%", width: "12%" }}
      viewBox="0 0 180 360"
    >
      <InkStroke d="M35 18 L18 338 M145 18 L162 338" length={642} />
      <InkStroke color={accent} d="M28 81 L152 81 M24 145 L156 145 M21 210 L159 210 M19 275 L161 275" length={532} startF={4} width={7} />
    </AssetCanvas>
  );
};
