import type { FC } from "react";
import { AssetCanvas, type AssetProps, InkStroke } from "../shared";

export const Brain: FC<AssetProps> = ({ accent, className }) => {
  return (
    <AssetCanvas
      className={className}
      label="Brain"
      style={{ left: "12%", top: "14%", width: "19%" }}
      viewBox="0 0 310 240"
    >
      <InkStroke d="M153 205 C110 222 75 196 80 163 C40 161 29 119 57 96 C39 61 74 25 110 44 C135 10 174 22 183 48 C221 26 259 53 247 91 C282 111 267 158 230 164 C232 199 196 221 153 205 Z" length={980} />
      <InkStroke color={accent} d="M154 50 C131 73 141 92 162 104 C137 119 140 145 159 157 C140 171 143 191 153 205 M88 93 C116 93 117 119 101 132 M215 91 C190 94 188 120 207 134" length={430} startF={5} width={7} />
    </AssetCanvas>
  );
};
