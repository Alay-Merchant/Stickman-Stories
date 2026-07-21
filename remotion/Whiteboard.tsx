import type { FC } from "react";
import { AbsoluteFill, Sequence } from "remotion";
import type { Storyboard } from "../lib/schema";
import { Scene } from "./Scene";
import { COLORS, FPS } from "./style/whiteboard_v1";

export type WhiteboardProps = {
  storyboard: Storyboard;
  /**
   * Optional scene-aligned Remotion audio URLs. The production exporter may
   * choose to mux narration separately with FFmpeg, in which case this stays
   * empty while the visual composition renders.
   */
  audio?: string[];
};

export const durationInFramesForStoryboard = (storyboard: Storyboard): number => {
  const sceneFrames = storyboard.scenes.reduce((sum, scene) => {
    return sum + Math.max(1, Math.round(scene.duration_seconds * FPS));
  }, 0);

  return Math.max(1, sceneFrames);
};

export const Whiteboard: FC<WhiteboardProps> = ({ storyboard, audio = [] }) => {
  let from = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.boardWhite }}>
      {storyboard.scenes.map((scene, index) => {
        const durationInFrames = Math.max(1, Math.round(scene.duration_seconds * FPS));
        const sequence = (
          <Sequence
            durationInFrames={durationInFrames}
            from={from}
            key={scene.scene_id + "-" + index}
          >
            <Scene audioSrc={audio[index]} scene={scene} />
          </Sequence>
        );

        from += durationInFrames;
        return sequence;
      })}
    </AbsoluteFill>
  );
};
