import type { FC } from "react";
import { Composition, registerRoot, type AnyZodObject } from "remotion";
import type { Storyboard } from "../lib/schema";
import { Whiteboard, durationInFramesForStoryboard, type WhiteboardProps } from "./Whiteboard";
import { DIMS, FPS } from "./style/whiteboard_v1";

const landscapeStoryboard: Storyboard = {
  target: "yt_long",
  style_profile: "whiteboard_v1",
  scenes: [
    {
      scene_id: 1,
      duration_seconds: 5,
      narration: "A small change to your environment can make the good choice easier.",
      on_screen_text: "Make good choices obvious",
      purpose: "hook",
      characters: ["learner"],
      props: ["book", "arrow"],
      background: "desk",
      action: "learner points to an open book",
      transition_in: "marker_wipe",
      accent: "blue",
      claim_kind: "general_advice",
      source_refs: [],
      review_status: "ok",
    },
  ],
};

const portraitStoryboard: Storyboard = {
  ...landscapeStoryboard,
  target: "yt_short",
};

const metadataFor = ({ props }: { props: WhiteboardProps }) => {
  return {
    durationInFrames: durationInFramesForStoryboard(props.storyboard),
  };
};

export const Root: FC = () => {
  return (
    <>
      <Composition<AnyZodObject, WhiteboardProps>
        calculateMetadata={metadataFor}
        component={Whiteboard}
        defaultProps={{ audio: [], storyboard: landscapeStoryboard }}
        durationInFrames={durationInFramesForStoryboard(landscapeStoryboard)}
        fps={FPS}
        height={DIMS.yt_long.h}
        id="Whiteboard16x9"
        width={DIMS.yt_long.w}
      />
      <Composition<AnyZodObject, WhiteboardProps>
        calculateMetadata={metadataFor}
        component={Whiteboard}
        defaultProps={{ audio: [], storyboard: portraitStoryboard }}
        durationInFrames={durationInFramesForStoryboard(portraitStoryboard)}
        fps={FPS}
        height={DIMS.yt_short.h}
        id="Whiteboard9x16"
        width={DIMS.yt_short.w}
      />
    </>
  );
};

registerRoot(Root);
