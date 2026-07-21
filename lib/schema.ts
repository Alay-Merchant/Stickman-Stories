import {z} from "zod";

export const Target = z.enum(["yt_long", "yt_short", "reel", "tiktok"]);
export type Target = z.infer<typeof Target>;

export const RightsStatus = z.enum([
  "public_domain",
  "licensed",
  "creator_owned",
  "permission_confirmed",
  "commentary_review_required",
  "do_not_use",
]);
export type RightsStatus = z.infer<typeof RightsStatus>;

export const SpoilerPolicy = z.enum(["none", "premise_only", "partial", "full"]);
export type SpoilerPolicy = z.infer<typeof SpoilerPolicy>;

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

export const ProjectSettings = z.object({
  audience: z.string().max(240).default("Curious learners"),
  tone: z.enum(["curious", "calm", "playful", "direct", "serious"]).default("curious"),
  duration_seconds: z.number().int().min(20).max(600).default(55),
  spoiler_policy: SpoilerPolicy.default("none"),
  cta: z.string().max(300).default(""),
  required_ideas: z.array(z.string().min(1).max(240)).max(12).default([]),
  topics_to_avoid: z.array(z.string().min(1).max(240)).max(12).default([]),
  voice_notes: z.string().max(500).default(""),
  pronunciation_notes: z.string().max(1_500).default(""),
  music_license_note: z.string().max(500).default(""),
});
export type ProjectSettings = z.infer<typeof ProjectSettings>;

export const SourceSection = z.object({
  id: z.string().regex(/^section_[A-Za-z0-9_-]+$/),
  heading: z.string().min(1).max(240),
  start_offset: z.number().int().nonnegative(),
  end_offset: z.number().int().nonnegative(),
  excerpt: z.string().max(700),
});
export type SourceSection = z.infer<typeof SourceSection>;

export const ScriptSection = z.object({
  purpose: ScenePurpose,
  narration: z.string().min(1).max(1_000),
  claim_kind: ClaimKind.default("interpretation"),
  source_refs: z.array(z.string().max(200)).max(12).default([]),
  review_status: ReviewStatus.default("needs_review"),
});
export type ScriptSection = z.infer<typeof ScriptSection>;

export const Script = z.object({
  sections: z.array(ScriptSection).min(1).max(120),
});
export type Script = z.infer<typeof Script>;

export const EditorialBrief = z.object({
  objective: z.string().min(1).max(500),
  audience: z.string().min(1).max(500),
  angle: z.string().min(1).max(500),
  tone: z.enum(["curious", "calm", "playful", "direct", "serious"]),
  key_ideas: z.array(z.string().min(1).max(500)).min(1).max(8),
  caveats: z.array(z.string().min(1).max(500)).max(12).default([]),
  cta: z.string().min(1).max(500),
});
export type EditorialBrief = z.infer<typeof EditorialBrief>;

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
  camera: z.enum(["static", "slow_push_in", "slow_pull_back", "pan_left", "pan_right"]).default("static"),
  transition_in: Transition.default("cut"),
  transition_out: Transition.default("cut"),
  audio_cues: z.array(z.enum(["marker", "pop", "tick", "whoosh", "ding", "page_turn"])).max(4).default([]),
  accent: Accent.default("none"),
  claim_kind: ClaimKind,
  source_refs: z.array(z.string().max(200)).max(12).default([]),
  alt_description: z.string().max(300).default(""),
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

export const ShortCandidate = z.object({
  label: z.string().min(1).max(120),
  scene_ids: z.array(z.number().int().positive()).min(1).max(12),
  rationale: z.string().min(1).max(500),
});
export type ShortCandidate = z.infer<typeof ShortCandidate>;

export const Pack = z.object({
  titles: z.array(PackTitle).min(3),
  description: z.string().min(1).max(5_000),
  tags: z.array(z.string().min(1).max(60)).max(15),
  thumbnail_copy: z.string().max(40),
  chapters: z.array(z.object({timestamp: z.string().max(12), title: z.string().max(120)})).max(30).default([]),
  pinned_comment: z.string().max(1_000).default(""),
  short_candidates: z.array(ShortCandidate).max(15).default([]),
});
export type Pack = z.infer<typeof Pack>;

export const ReviewSeverity = z.enum(["info", "warning", "blocking"]);
export type ReviewSeverity = z.infer<typeof ReviewSeverity>;

export const ReviewIssue = z.object({
  id: z.string().min(1).max(120),
  severity: ReviewSeverity,
  area: z.enum(["rights", "source", "script", "storyboard", "style", "captions", "audio", "export"]),
  message: z.string().min(1).max(600),
  scene_id: z.number().int().positive().optional(),
  resolution: z.string().max(600).optional(),
});
export type ReviewIssue = z.infer<typeof ReviewIssue>;

export const QaReport = z.object({
  generated_at: z.string().datetime(),
  can_render: z.boolean(),
  issues: z.array(ReviewIssue).max(300),
});
export type QaReport = z.infer<typeof QaReport>;
