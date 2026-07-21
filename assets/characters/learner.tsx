import type { CSSProperties, FC } from "react";
import { useVideoConfig } from "remotion";
import { COLORS } from "../../remotion/style/whiteboard_v1";
import { AssetCanvas, type CharacterProps, InkStroke } from "../shared";

type PoseDrawing = {
  arms: string[];
  legs: string[];
  extra?: string[];
};

const poseDrawing = (pose: string): PoseDrawing => {
  switch (pose) {
    case "point":
      return {
        arms: ["M130 154 L89 198", "M130 154 L190 105 L221 105"],
        legs: ["M130 222 L94 288", "M130 222 L168 288"],
      };
    case "think":
      return {
        arms: ["M130 154 L84 201", "M130 154 L170 103 L159 77"],
        legs: ["M130 222 L96 288", "M130 222 L166 288"],
        extra: ["M154 45 C179 18 204 34 196 55 C190 70 174 67 176 85"],
      };
    case "read":
      return {
        arms: ["M130 154 L90 193 L111 222", "M130 154 L172 193 L151 222"],
        legs: ["M130 222 L96 288", "M130 222 L166 288"],
        extra: ["M84 204 L130 191 L176 204 L176 245 L130 232 L84 245 Z", "M130 191 L130 232"],
      };
    case "celebrate":
      return {
        arms: ["M130 154 L76 82", "M130 154 L186 82"],
        legs: ["M130 222 L84 270", "M130 222 L176 270"],
        extra: ["M59 60 L40 37", "M74 45 L74 14", "M198 57 L220 34"],
      };
    case "confused":
      return {
        arms: ["M130 154 L76 177 L52 161", "M130 154 L186 177 L211 160"],
        legs: ["M130 222 L96 288", "M130 222 L166 288"],
        extra: ["M193 74 C215 49 240 66 229 83 C220 95 205 95 209 111", "M211 126 L211 130"],
      };
    case "idle":
    default:
      return {
        arms: ["M130 154 L83 207", "M130 154 L177 207"],
        legs: ["M130 222 L96 288", "M130 222 L166 288"],
      };
  }
};

/**
 * Neutral viewer-perspective character. A small coloured scarf is its only
 * identity cue; all anatomy remains simple ink strokes.
 */
export const Learner: FC<CharacterProps> = ({ accent, className, pose }) => {
  const { width, height } = useVideoConfig();
  const portrait = height > width;
  const drawing = poseDrawing(pose);
  const placement: CSSProperties = portrait
    ? { height: "42%", left: "23%", top: "28%", width: "54%" }
    : { height: "58%", left: "36%", top: "22%", width: "28%" };

  return (
    <AssetCanvas
      className={className}
      label={"Learner, " + pose}
      style={placement}
      viewBox="0 0 260 310"
    >
      <InkStroke d="M130 32 A48 48 0 1 1 129.9 32" length={302} startF={0} />
      <InkStroke d="M130 128 L130 222" length={94} startF={4} />
      <InkStroke color={accent} d="M96 137 C113 148 146 148 164 137" length={72} startF={6} width={10} />
      {drawing.arms.map((d, index) => (
        <InkStroke d={d} key={"arm-" + index} length={105} startF={7 + index * 2} />
      ))}
      {drawing.legs.map((d, index) => (
        <InkStroke d={d} key={"leg-" + index} length={82} startF={11 + index * 2} />
      ))}
      {drawing.extra?.map((d, index) => (
        <InkStroke d={d} key={"extra-" + index} length={150} startF={13 + index * 2} />
      ))}
      <circle cx="112" cy="72" fill={COLORS.ink} r="4.5" />
      <circle cx="147" cy="72" fill={COLORS.ink} r="4.5" />
      <InkStroke d={pose === "confused" ? "M112 101 L130 96 L148 101" : "M112 96 Q130 108 148 96"} length={42} startF={9} width={5} />
    </AssetCanvas>
  );
};
