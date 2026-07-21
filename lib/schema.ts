import { z } from "zod";

export const Target = z.enum(["yt_long", "yt_short", "reel", "tiktok"]);
export type Target = z.infer<typeof Target>;

export const ScenePurpose = z.enum([
  "hook",
  "explain",
  "contrast",
  "demonstrate",
  "recap",
  "transition",
]);
export type ScenePurpose = z.infer<typeof ScenePurpose>;

export const Transition = z.enum(["cut", "marker_wipe", "slide", "zoom", "erase_reveal"]);
export type Transition = z.infer<typeof Transition>;

export const Accent = z.enum(["blue", "green", "red", "yellow", "none"]);
export type Accent = z.infer<typeof Accent>;

export const ClaimKind = z.enum([
  "fact",
  "interpretation",
  "general_advice",
  "creative_example",
]);
export type ClaimKind = z.infer<typeof ClaimKind>;

export const ReviewStatus = z.enum(["ok", "needs_review"]);
export type ReviewStatus = z.infer<typeof ReviewStatus>;

export const Scene = z.object({
  scene_id: z.number().int().positive(),
  duration_seconds: z.number().min(1).max(12),
  narration: z.string().min(1).max(1_000),
  on_screen_text: z.string().max(60).default(""),
  purpose: ScenePurpose,
  characters: z.array(z.string().max(80)).max(4).default([]),
  props: z.array(z.string().max(80)).max(10).default([]),
  background: z.string().max(80),
  action: z.string().min(1).max(400),
  transition_in: Transition.default("cut"),
  accent: Accent.default("none"),
  claim_kind: ClaimKind,
  source_refs: z.array(z.string().max(200)).max(12).default([]),
  review_status: ReviewStatus.default("ok"),
});
export type Scene = z.infer<typeof Scene>;

export const Storyboard = z.object({
  target: Target,
  style_profile: z.literal("whiteboard_v1"),
  scenes: z.array(Scene).min(1).max(120),
});
export type Storyboard = z.infer<typeof Storyboard>;

export const PackTitle = z.object({
  text: z.string().min(1).max(120),
  angle: z.string().min(1).max(100),
  score: z.number(),
});
export type PackTitle = z.infer<typeof PackTitle>;

export const Pack = z.object({
  titles: z.array(PackTitle).min(3),
  description: z.string().min(1).max(5_000),
  tags: z.array(z.string().min(1).max(60)).max(15),
  thumbnail_copy: z.string().max(40),
});
export type Pack = z.infer<typeof Pack>;
