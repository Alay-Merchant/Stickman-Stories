import type { FC } from "react";
import { AssetCanvas, type AssetProps, InkStroke } from "../shared";

export const Book: FC<AssetProps> = ({ accent, className }) => {
  return (
    <AssetCanvas
      className={className}
      label="Open book"
      style={{ left: "8%", top: "48%", width: "18%" }}
      viewBox="0 0 300 220"
    >
      <InkStroke d="M22 44 C78 28 120 42 150 69 L150 184 C116 158 75 149 22 165 Z" length={480} />
      <InkStroke d="M278 44 C222 28 180 42 150 69 L150 184 C184 158 225 149 278 165 Z" length={480} startF={3} />
      <InkStroke color={accent} d="M52 81 L116 73 M52 109 L119 101 M248 81 L184 73 M248 109 L181 101" length={260} startF={7} width={6} />
    </AssetCanvas>
  );
};
