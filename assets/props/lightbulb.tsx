import type { FC } from "react";
import { AssetCanvas, type AssetProps, InkStroke } from "../shared";

export const Lightbulb: FC<AssetProps> = ({ accent, className }) => {
  return (
    <AssetCanvas
      className={className}
      label="Idea lightbulb"
      style={{ left: "72%", top: "16%", width: "15%" }}
      viewBox="0 0 240 280"
    >
      <InkStroke d="M120 28 C63 28 38 75 47 125 C53 158 83 169 86 204 L154 204 C157 169 187 158 193 125 C202 75 177 28 120 28 Z" length={570} />
      <InkStroke d="M88 220 L152 220 M95 241 L145 241" length={114} startF={4} />
      <InkStroke color={accent} d="M120 7 L120 0 M31 55 L12 39 M209 55 L228 39 M41 137 L17 143 M199 137 L223 143" length={155} startF={7} width={7} />
    </AssetCanvas>
  );
};
