import type { CSSProperties, FC } from "react";
import { AbsoluteFill, Audio, interpolate, useCurrentFrame } from "remotion";
import { getBackground, getCharacter, getProp, poseFor } from "../assets";
import type { Scene as StoryboardScene } from "../lib/schema";
import { Caption } from "./components/Caption";
import { ACCENT, COLORS } from "./style/whiteboard_v1";

export type SceneProps = {
  scene: StoryboardScene;
  audioSrc?: string;
};

const compactCaption = (narration: string): string => {
  const trimmed = narration.trim();
  if (trimmed.length <= 92) return trimmed;

  const words = trimmed.split(/\s+/);
  const selected: string[] = [];
  let count = 0;
  for (const word of words) {
    if (count + word.length + (selected.length ? 1 : 0) > 88) break;
    selected.push(word);
    count += word.length + (selected.length > 1 ? 1 : 0);
  }

  return selected.join(" ") + "…";
};

const transitionStyleFor = (
  transition: StoryboardScene["transition_in"],
  frame: number,
): CSSProperties => {
  const progress = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  switch (transition) {
    case "marker_wipe":
      return { clipPath: "inset(0 " + Math.round((1 - progress) * 100) + "% 0 0)" };
    case "slide":
      return { transform: "translateX(" + Math.round((1 - progress) * 110) + "px)" };
    case "zoom":
      return {
        opacity: progress,
        transform: "scale(" + (0.94 + progress * 0.06) + ")",
        transformOrigin: "center",
      };
    case "erase_reveal":
      return { clipPath: "inset(0 0 0 " + Math.round((1 - progress) * 100) + "%)" };
    case "cut":
    default:
      return {};
  }
};

export const Scene: FC<SceneProps> = ({ scene, audioSrc }) => {
  const frame = useCurrentFrame();
  const accent = ACCENT[scene.accent] ?? COLORS.ink;
  const Background = getBackground(scene.background);
  const Character = scene.characters[0] ? getCharacter(scene.characters[0]) : null;
  const caption = compactCaption(scene.narration);
  const transitionStyle = transitionStyleFor(scene.transition_in, frame);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.boardWhite }}>
      <AbsoluteFill style={transitionStyle}>
        <Background accent={accent} />
        {Character ? <Character accent={accent} pose={poseFor(scene.action)} /> : null}
        {scene.props.map((id, index) => {
          const Prop = getProp(id);
          return <Prop accent={accent} key={id + "-" + index} />;
        })}
        {scene.on_screen_text ? (
          <Caption accent={accent} placement="top" text={scene.on_screen_text} />
        ) : null}
        <Caption accent={accent} placement="bottom" text={caption} />
      </AbsoluteFill>
      {audioSrc ? <Audio src={audioSrc} /> : null}
    </AbsoluteFill>
  );
};
