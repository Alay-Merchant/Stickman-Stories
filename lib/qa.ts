import type {ProjectManifest} from "./project";
import {
  QaReport,
  type QaReport as QaReportValue,
  type ReviewIssue,
  type Script,
  type SourceSection,
  type Storyboard,
} from "./schema";

// Keep server-side QA independent from Remotion/React asset components. The
// renderer has its own registry; this small vocabulary is the approved v1
// manifest and is safe to load in a route handler.
const characterIds = ["learner"] as const;
const propIds = ["book", "phone", "arrow", "checkbox", "lightbulb", "graph", "coin", "clock", "brain", "ladder"] as const;
const backgroundIds = ["blank_board", "desk", "outdoor"] as const;

type QaInput = {
  manifest: ProjectManifest;
  sourceSections: SourceSection[];
  script: Script | null;
  storyboard: Storyboard | null;
};

const issue = (
  id: string,
  severity: ReviewIssue["severity"],
  area: ReviewIssue["area"],
  message: string,
  sceneId?: number,
): ReviewIssue => ({id, severity, area, message, ...(sceneId ? {scene_id: sceneId} : {})});

const highStakes = /\b(medical|diagnos(?:e|is)|treatment|legal|lawsuit|invest(?:ment|ing)|financial advice|therapy|mental health)\b/i;

export const runQa = ({manifest, sourceSections, script, storyboard}: QaInput): QaReportValue => {
  const issues: ReviewIssue[] = [];
  const knownRefs = new Set(sourceSections.map((section) => section.id));

  if (manifest.rights_status === "do_not_use") {
    issues.push(issue("rights-do-not-use", "blocking", "rights", "This source is marked do not use. Choose an approved source before rendering."));
  }
  if (!manifest.approvals.source_reviewed_at) {
    issues.push(issue("source-review", "blocking", "rights", "Confirm the source rights and factual-review responsibility before rendering."));
  }
  if (manifest.input_mode === "reference_only") {
    issues.push(issue("reference-only", "warning", "source", "Reference-only projects require fact checking against public sources; model memory is not a source."));
  }
  if (!sourceSections.length && manifest.input_mode === "text") {
    issues.push(issue("source-map", "blocking", "source", "No readable source sections were detected. Update the source before generating."));
  }

  if (!script) {
    issues.push(issue("script-missing", "blocking", "script", "Generate or save a script before rendering."));
  } else {
    if (!manifest.approvals.script_reviewed_at) {
      issues.push(issue("script-review", "blocking", "script", "Review and approve the editable script before narration or rendering."));
    }
    script.sections.forEach((section, index) => {
      if (section.claim_kind === "fact" && !section.source_refs.length) {
        issues.push(issue(`script-fact-${index}`, "blocking", "script", "A factual script line needs at least one source reference."));
      }
      if (section.source_refs.some((reference) => !knownRefs.has(reference))) {
        issues.push(issue(`script-ref-${index}`, "blocking", "script", "A script line refers to a source section that no longer exists."));
      }
      if (section.review_status === "needs_review") {
        issues.push(issue(`script-review-${index}`, "warning", "script", "A script line is still marked for review."));
      }
      if (highStakes.test(section.narration)) {
        issues.push(issue(`script-high-stakes-${index}`, "warning", "script", "This line may contain a high-stakes claim; obtain specialist review before publishing."));
      }
    });
  }

  if (!storyboard) {
    issues.push(issue("storyboard-missing", "blocking", "storyboard", "Generate or save a storyboard before rendering."));
  } else {
    if (!manifest.approvals.storyboard_reviewed_at) {
      issues.push(issue("storyboard-review", "blocking", "storyboard", "Review and approve the storyboard before rendering."));
    }
    const duration = storyboard.scenes.reduce((total, scene) => total + scene.duration_seconds, 0);
    const maximum = storyboard.target === "reel" ? 90 : storyboard.target === "yt_long" ? 600 : 60;
    if (duration > maximum + 0.01) {
      issues.push(issue("target-duration", "blocking", "export", `The ${Math.round(duration)} second storyboard exceeds this target's ${maximum}-second limit.`));
    }
    if (storyboard.target === "yt_long" && duration < 300) {
      issues.push(issue("long-duration", "warning", "export", "Long-form is planned for 5–10 minutes; this storyboard is shorter."));
    }
    storyboard.scenes.forEach((scene) => {
      const invalidCharacter = scene.characters.find((asset) => !characterIds.includes(asset as (typeof characterIds)[number]));
      const invalidProp = scene.props.find((asset) => !propIds.includes(asset as (typeof propIds)[number]));
      if (invalidCharacter || invalidProp || !backgroundIds.includes(scene.background as (typeof backgroundIds)[number])) {
        issues.push(issue(`asset-${scene.scene_id}`, "blocking", "style", "This scene references an unapproved whiteboard asset.", scene.scene_id));
      }
      if (scene.on_screen_text.length > 60) {
        issues.push(issue(`text-${scene.scene_id}`, "blocking", "style", "On-screen text is longer than 60 characters.", scene.scene_id));
      }
      if (scene.narration.length / Math.max(scene.duration_seconds, 1) > 17) {
        issues.push(issue(`caption-speed-${scene.scene_id}`, "warning", "captions", "Caption reading speed may be above 17 characters per second.", scene.scene_id));
      }
      if (scene.duration_seconds > 5 && /^(idle|static|stand)$/i.test(scene.action.trim())) {
        issues.push(issue(`motion-${scene.scene_id}`, "warning", "style", "A long scene may have no meaningful visual change.", scene.scene_id));
      }
      if (scene.claim_kind === "fact" && !scene.source_refs.length) {
        issues.push(issue(`fact-${scene.scene_id}`, "blocking", "source", "A factual scene needs at least one source reference.", scene.scene_id));
      }
      if (scene.source_refs.some((reference) => !knownRefs.has(reference))) {
        issues.push(issue(`source-ref-${scene.scene_id}`, "blocking", "source", "A scene refers to a source section that no longer exists.", scene.scene_id));
      }
      if (scene.review_status === "needs_review") {
        issues.push(issue(`scene-review-${scene.scene_id}`, "blocking", "storyboard", "This scene is marked for review before rendering.", scene.scene_id));
      }
      if (highStakes.test(scene.narration)) {
        issues.push(issue(`high-stakes-${scene.scene_id}`, "warning", "source", "This scene may contain a high-stakes claim; obtain specialist review.", scene.scene_id));
      }
    });
  }

  if (!manifest.settings.music_license_note.trim()) {
    issues.push(issue("music-license", "warning", "audio", "Record the licence or provenance of the music bed before publishing."));
  }

  return QaReport.parse({
    generated_at: new Date().toISOString(),
    can_render: !issues.some((entry) => entry.severity === "blocking"),
    issues,
  });
};
