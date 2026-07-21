# Book-to-Stickman Studio — Product Plan

## 1. Product vision

Build a local-first AI studio that turns a permitted book, source material, or user-authored outline into original teaching videos with a recognisable **whiteboard stickman** visual identity.

The studio should make one creator feel like a small production team:

```text
Source material → understanding → original teaching script → storyboard
→ whiteboard animation → narration + audio → platform-ready video package
```

The first customer is the channel operator. The product succeeds when they can reliably create an accurate, enjoyable long-form video and several short clips from one approved source, while retaining editorial control at every meaningful step.

## 2. Product principles and goals

### Principles

- **Teach, do not substitute.** Explain ideas in original language, with examples and commentary; do not recreate a book in video form.
- **Editor remains in charge.** AI proposes; the creator approves scripts, facts, scene choices, voice, and export.
- **Consistency beats novelty.** Reusable SVG assets and explicit style rules matter more than one-off generative visuals.
- **One source, many formats.** A long video should be the source for Shorts, Reels, TikToks, thumbnails, captions, and descriptions.
- **Local-first and auditable.** Keep project files, scripts, source references, scene data, and exports organised locally. Use cloud AI services only for the parts the creator enables.
- **Quality gates before rendering.** Validate factual support, copyright risk, timing, style compliance, and platform specifications before export.

### Goals

1. Convert structured notes or approved book text into an editable teaching script.
2. Convert the script into a time-coded storyboard made of reusable stickman scenes.
3. Render a consistent 9:16 Short and 16:9 long-form video locally.
4. Produce a complete publishing pack: video, thumbnail, title options, description, captions, chapters, and short-form cut suggestions.
5. Establish a channel identity that viewers recognise within the first few seconds.

### Non-goals for the first version

- Fully autonomous publishing or unsupervised uploads.
- Pixel-perfect character animation comparable to a character-animation studio.
- Supporting every book format, language, and publisher restriction on day one.
- Generating a “complete replacement” for any copyrighted work.
- Building a creator-facing SaaS before the internal workflow is proven.

## 3. Target audience and content formats

| Audience | Need | Primary output |
|---|---|---|
| Channel operator | Produce consistent educational videos quickly | 5–10 minute YouTube video + assets |
| Short-form viewer | Learn one useful, memorable idea quickly | 30–90 second Short / Reel / TikTok |
| Learner | Understand a concept and apply it | Clear explanation, example, action step |
| Future creator customer | Turn licensed or owned content into videos | Guided project workflow |

### Content modes

- **Non-fiction teaching mode:** premise, key ideas, examples, counterpoints, practical application, recap.
- **Fiction discussion mode:** spoiler-labelled high-level premise, selected plot beats, themes, character arcs, and original analysis. Avoid scene-by-scene retelling.
- **Notes / public-domain mode:** user outlines, research, public-domain works, licensed manuscripts, or original articles—ideal for early testing.

### Standard video structures

**Short (30–60 seconds):** hook → tension/problem → one idea → visual example → takeaway / CTA.

**Extended short (60–90 seconds):** hook → context → 2–3 beats → memorable analogy → takeaway.

**Long video (5–10 minutes):** promise → why it matters → 3–5 core ideas → examples → limitations/caveats → action steps → recap → next-video CTA.

## 4. MVP definition

The MVP is a local “Book-to-Storyboard Studio,” not an autonomous video factory.

### Must-have workflow

1. Create a project and add an approved source as text, Markdown, EPUB/PDF extraction, or notes.
2. Review detected chapters/sections and correct them.
3. Generate a source-grounded brief, key ideas, and an editable script for a chosen duration.
4. Generate an editable scene storyboard with narration, on-screen text, actions, assets, duration, and transitions.
5. Preview scenes in the locked whiteboard stickman style.
6. Render a basic video with synthetic narration, captions, music bed, and MP4 export.
7. Export an accompanying publishing pack and a 9:16 Short version.

### MVP acceptance criteria

- A creator can complete a 60-second video from approved source text without editing code.
- Every scene uses only approved visual tokens and assets, unless flagged as an explicit style exception.
- Scene narration and visual timing are editable before render.
- The output renders as H.264 MP4 with captions and correctly framed 16:9 or 9:16 layout.
- Project data can be reopened locally with source-to-claim references preserved.
- The system flags quotations, unsupported assertions, source gaps, and content that needs human review.

## 5. Phased roadmap

| Phase | Outcome | Key deliverables | Exit criterion |
|---|---|---|---|
| 0. Channel foundation | Prove the content identity | Style guide, brand kit, 3 manual pilot videos | A repeatable visual language and editing checklist exist |
| 1. Script studio | Make high-quality scripts from approved inputs | Ingestion, source map, AI brief, script editor | One 5-minute script can be approved in one review pass |
| 2. Storyboard studio | Convert scripts into reusable scenes | Scene schema, asset picker, timeline, preview | 90% of pilot scenes use the approved library |
| 3. Render pipeline | Produce platform-ready MP4s | SVG animation, TTS, captions, FFmpeg assembly | A 60-second video renders locally end-to-end |
| 4. Publishing workflow | Make distribution efficient | Short extractor, thumbnail/copy generator, export pack | One long video produces 5 reviewable clips |
| 5. Production hardening | Publish consistently | Queue, project history, QA dashboard, analytics import | 8–12 weekly releases with predictable quality |
| 6. Product expansion | Consider external users | Accounts, hosted rendering, permissions, billing | Internal workflow is profitable and stable first |

## 6. User experience and UI

The interface should feel like a focused creative studio, not a chat window. Use a project-based layout with persistent progress and easy editing.

### Quick create: title + platform → package

The fast path. The creator enters a **book title and author**, picks a **target** (YouTube long, YouTube Short, Reel, TikTok), and the studio runs the whole pipeline (section 9) to a reviewable draft: script, storyboard, render, and a ranked publishing pack (section 14). The platform choice is made *up front* — it is not a late export setting — and drives structure, duration, pacing, hook, caption style, and metadata from the start.

If no manuscript is supplied, the run uses **reference-only mode** (section 10) and marks every claim that is not manuscript-grounded for human fact-check.

**Target-first generation presets**

| Target | Aspect / length | Structure (§3) | Hook & captions | Metadata focus (§14) |
|---|---|---|---|---|
| YouTube long-form | 16:9, 5–10 min | promise → 3–5 ideas → caveats → recap → CTA | spoken promise in first 10 s; full-sentence lower-third | search + suggested: keyworded title, thumbnail, chapters, description |
| YouTube Short | 9:16, ≤ 60 s | hook → one idea → example → takeaway | on-screen title on frame 1; kinetic 2–4-word captions | first-frame text + native title; hashtags |
| Instagram Reel | 9:16, ≤ 60–90 s | hook → 2–3 beats → takeaway | safe lower area; concise caption | cover frame + concise caption |
| TikTok | 9:16, ≤ 60 s | hook → one idea → payoff | quick spoken hook < 2 s; native-sounding caption | native title/caption, trend-aware (licensed audio only) |

The creator still approves every step; "quick create" changes the *entry point*, not the review gates.

### Main screens

1. **Projects** — recent projects, status, exports, template selection.
2. **Source** — import material; show extraction quality, chapters, source permissions, and source notes.
3. **Brief** — audience, learning objective, angle, tone, duration, spoiler setting, and calls to action.
4. **Script** — section-based editor with source citations, claim flags, estimated duration, and revision history.
5. **Storyboard** — timeline plus scene cards; edit narration, visual instructions, assets, text, camera movement, and duration.
6. **Style and assets** — select approved character, prop, icon, background, colour accent, and animation preset.
7. **Voice and audio** — narration voice, pace, pronunciation dictionary, music bed, sound effects, and mix levels.
8. **Preview and QA** — play rendered preview; show style, copyright, timing, caption-safe-area, and unsupported-claim warnings.
9. **Export** — choose YouTube 16:9, YouTube Short, Instagram Reel, TikTok, captions, thumbnail, and publishing copy.

### Storyboard scene card

Each scene has the following editable fields:

```yaml
scene_id: 12
duration_seconds: 6.5
narration: "Your environment quietly votes for the choices you make."
on_screen_text: "Make good choices obvious"
purpose: explain
source_refs: [chapter_4, note_18]
characters: [main_stickman]
props: [phone, fruit_bowl]
background: kitchen_whiteboard
action: character_reaches_for_fruit_then_phone
camera: slow_push_in
transition_in: marker_wipe
transition_out: swipe_left
audio_cues: [soft_pop]
style_profile: whiteboard_v1
review_status: needs_review
```

### Editing rules

- Changes to a script line should highlight affected scenes.
- Changes to an asset should update all linked scene previews, but never overwrite a manual scene override silently.
- Every AI output needs “accept,” “edit,” and “regenerate with instruction” controls.
- Display timing in both seconds and spoken-word estimate.
- Keep a visible **source support** indicator on every factual claim.

## 7. Strict whiteboard stickman visual design system

The visual system is the channel’s most valuable creative asset. It must be codified as versioned rules (`whiteboard_v1`) that the renderer and AI can validate.

### 7.1 Visual promise

Videos look as if they are being drawn and animated live on a clean whiteboard: simple black stick figures, sparse accent colour, hand-drawn motion, clear diagrams, and bold teaching text. The audience should recognise the style before reading the channel name.

### 7.2 Colour tokens

| Token | Hex | Use | Maximum share per scene |
|---|---:|---|---:|
| Board white | `#FAFAF7` | Default background | 100% base |
| Ink black | `#171717` | Figures, text, outlines | Primary ink |
| Charcoal | `#4A4A4A` | Secondary annotation | Limited |
| Learning blue | `#2F80ED` | Concepts, arrows, positive emphasis | 10% |
| Action green | `#27AE60` | Progress, solution, confirmation | 8% |
| Alert red | `#EB5757` | Mistakes, friction, warning | 5% |
| Idea yellow | `#F2C94C` | Highlight / spark / key phrase | 8% |

Rules:

- White and black must dominate every scene.
- Use one accent colour per scene; a second is allowed only when contrasting problem versus solution.
- Do not use gradients, photographic textures, drop shadows, neon, or full-colour illustrations.
- Accent colours communicate meaning consistently: blue = idea, green = desired action, red = obstacle, yellow = insight.

### 7.3 Line, shape, and drawing rules

- Canvas master: 1920×1080 for 16:9; derive 1080×1920 layouts from the same scene semantics, not by naïve cropping.
- Base stroke: 8 px at 1920×1080, round caps and joins; 6–12 px only for hierarchy.
- Use slightly imperfect vector paths or a subtle hand-drawn wobble (1–2 px); never use messy, illegible scribbles.
- Stickman head: unfilled circle; body and limbs: single strokes; hands/feet: short lines, not detailed anatomy.
- Faces use only dot eyes, a line mouth, eyebrows, and optional sweat/tear marks. Avoid realism.
- Props are recognisable using 3–12 strokes; details must support the teaching point.
- Use simple geometric diagrams, arrows, labels, checkboxes, calendars, and bar charts in the same ink language.
- No logos, branded product interfaces, copyrighted character likenesses, or AI-image backgrounds unless rights are confirmed.

### 7.4 Typography and layout

- Primary font: a licensed, highly legible handwritten or marker-style font; fallback: a clean rounded sans-serif.
- Body captions: high-legibility sans-serif, not handwriting, to protect accessibility.
- Titles: 72–96 px equivalent in 16:9; captions: 42–56 px equivalent; never more than two font families.
- Use sentence case; 3–7 words per on-screen teaching phrase whenever possible.
- Text must never cover faces, the core action, or caption safe areas.
- Maintain a 6% horizontal and 8% vertical safe margin; use stricter 12% bottom safe area for short-form platform overlays.

### 7.5 Character system

Keep a small cast with identifiable, reusable silhouettes:

- **Learner:** neutral main character; default perspective of the viewer.
- **Guide:** optional narrator/teacher with marker or pointer.
- **Future self:** same learner with a green accent accessory.
- **Obstacle:** same learner with red symbol/cloud; not a separate villain.
- **Groups:** duplicate base figure with small accessory variations only.

Character identity comes from one accessory (cap, glasses, tie, bun, scarf) and one accent—never from complex redesign. Create a pose sheet for each character: idle, walk, run, sit, read, think, speak, point, celebrate, confused, stressed, and listen.

### 7.6 Motion and transition rules

- Standard tempo: 1 meaningful visual change every 2–4 seconds.
- Draw-on entrance: 250–600 ms; small emphasis bounce: 120–180 ms; hold key idea long enough to read once.
- Favour marker draw, slide, wipe, push-in, and simple zoom. Avoid 3D spins, excessive shake, glitch effects, and fast flashing.
- Use a transition only to signal a new beat; direct cuts are preferred within a continuous explanation.
- Sound effects are light and purposeful: marker scratch, soft pop, tick, whoosh, ding. Never let effects compete with narration.
- Motion should clarify cause-and-effect: arrow appears before result; obstacle blocks path; solution removes it.

### 7.7 Style compliance checks

Before render, automatically flag:

- More than two accents in a scene.
- Non-approved fonts, colours, stroke widths, or asset families.
- A full-frame dense text block.
- Caption overlap or out-of-safe-area text.
- Unapproved raster imagery.
- A scene with no visual change for more than five seconds.
- A motion preset outside `whiteboard_v1`.

Every project stores the style profile version so old videos can be reproduced exactly after a future redesign.

## 8. Reusable asset library

Assets should be authored as parameterised SVG components with a metadata manifest, not regenerated per scene.

### Initial library

| Category | Initial target | Examples |
|---|---:|---|
| Characters | 5 base variants | learner, guide, child, professional, group |
| Poses/actions | 40+ | read, walk, point, think, type, celebrate, fail, choose |
| Expressions | 12 | neutral, happy, concerned, confused, surprised, determined |
| Props | 100+ | book, phone, laptop, alarm, coin, calendar, desk, door |
| Icons/diagrams | 60+ | arrow, graph, loop, checklist, brain, lightbulb, ladder |
| Backgrounds | 20 | blank board, home, office, classroom, street, library |
| Transitions | 8 | marker wipe, pull-back, slide, zoom, erase/reveal |
| Sound cues | 15 | marker, pop, tick, swoosh, ding, page turn |

### Asset metadata

```yaml
id: prop_book_open_v1
category: prop
style_profile: whiteboard_v1
tags: [book, reading, learning]
anchor_points: [center, left_hand, right_hand, table]
colour_slots: [ink, accent]
allowed_actions: [hold, open, point_to]
license: original
version: 1
```

### Library governance

- Only add an asset when it will be reused in at least three foreseeable scenes.
- New assets need a thumbnail, SVG source, manifest, style validation, and usage example.
- Keep deprecated assets available for old projects but prevent them from being selected in new `whiteboard_v1` work.
- Build a “missing asset” queue; use a simple placeholder in the current edit rather than introducing off-style art.

## 9. AI and production pipeline

### End-to-end pipeline

```text
Import and permission check
  → extract / clean / segment source
  → chapter summaries and source map
  → concepts, events, themes, and claim candidates
  → editorial brief
  → original teaching script with citations
  → fact/copyright/style review
  → structured storyboard
  → asset selection and animation plan
  → narration and captions
  → scene rendering and audio mix
  → quality assurance
  → master export + social derivatives + publishing pack
```

### AI responsibilities

- Propose chapter boundaries, summaries, concepts, relationships, timeline, and notable examples.
- Draft an original explanation for a selected audience and duration.
- Generate scene-level visual metaphors using only approved asset vocabulary.
- Identify candidate short clips from strong hooks, surprising ideas, and complete micro-lessons.
- Suggest titles, descriptions, tags, thumbnail copy, and captions.

### Human responsibilities

- Confirm source rights and intended use.
- Choose the editorial angle and audience.
- Approve factual claims, analysis, quotations, spoilers, and attribution.
- Review the script, scene rhythm, voice, and all final exports.
- Decide what gets published.

### Grounding and quality controls

- Store a source reference for each factual claim and each direct quotation.
- Separate **source-supported fact**, **interpretation**, **general advice**, and **creative example** in the script model.
- Require a human decision for low-confidence claims, conflicting source summaries, medical/legal/financial claims, and any direct quote.
- Prevent the model from inventing citations; show source snippets only to the editor, not necessarily in the public video.
- Use a retrieval step over the imported, permitted source rather than relying only on model memory.

## 10. Book ingestion and understanding

### Supported inputs, in order

1. **Title + author only — reference-only mode.** No manuscript is provided; the studio works from public, verifiable information and explicitly marks that claims are not grounded in the book text. Lowest setup effort, highest fact-check burden (see below).
2. Creator-written outline, notes, research, or public-domain text.
3. Clean EPUB, Markdown, DOCX, or exported text with provenance.
4. Text-based PDF.
5. Scanned PDF using OCR, always with an extraction-quality warning.

### Reference-only mode (title + author, no manuscript)

When the only input is a title and author, there is no source text to retrieve against, so the pipeline changes:

- Build the knowledge store from **public, verifiable material** — the author's own framing, publisher blurb, established summaries, interviews, and reviews — with a source link for each fact, exactly as in grounded mode. Model memory alone is not a source.
- Restrict output to **premise, themes, and widely-reported key ideas.** Do not fabricate specific quotations, statistics, page-level detail, or (for fiction) plot specifics that cannot be verified.
- Mark every claim `interpretation` or `general advice` unless a public source supports it as fact, and route the video through mandatory human fact-check before render.
- This mode is deliberately **not part of the MVP** (section 4) and carries higher hallucination risk (section 18); it is a convenience with stronger review, not a shortcut around grounding.

Rights position is usually easier here — no manuscript is copied — but the transformative-commentary and quotation rules in section 16 still apply.

### Ingestion steps

1. Record title, author, edition, language, source owner, usage permission, and import date.
2. Extract text and preserve page/chapter anchors.
3. Clean headers, footers, hyphenation, duplicated content, and OCR artefacts.
4. Detect chapters, headings, lists, quotes, tables, and footnotes.
5. Chunk by semantic sections while retaining original location references.
6. Generate section summaries, key claims, examples, characters/events (for fiction), themes, and uncertainties.
7. Create a searchable project knowledge store with source links.
8. Present an editor-readable “understanding report” before any script generation.

### Fiction-specific model

Store characters, relationships, settings, chronology, plot turns, themes, and spoiler level separately. Summaries must be scoped by the selected spoiler policy: premise only, partial spoilers, or full discussion.

### Non-fiction-specific model

Store thesis, framework, supporting examples, evidence type, caveats, exercises, counterarguments, and practical implications. The teaching script should make clear which ideas belong to the author and which are the channel’s interpretation.

## 11. Script and storyboard generation

### Editorial brief inputs

- Objective: what should the viewer understand, remember, or do?
- Audience: beginner, student, professional, enthusiast.
- Format and target duration.
- Tone: curious, calm, playful, direct, serious.
- Content mode and spoiler policy.
- Required ideas, examples, caveats, CTA, and topics to avoid.
- Style profile: `whiteboard_v1`.

### Script generation rules

- Open with a specific promise or tension, not a generic book introduction.
- Use original wording; limit direct quotations and show attribution where used.
- Prefer explanation through a simple situation, contrast, or analogy.
- Give one clear takeaway per section.
- Include uncertainty and limitations when the source warrants them.
- Budget roughly 130–155 spoken words per minute, allowing space for visual beats.
- Make every line visually actionable. If it cannot be visualised, rewrite it or use a diagram.

### Storyboard generation rules

- One scene has one teaching job: hook, explain, contrast, demonstrate, recap, or transition.
- Map scenes to a finite action vocabulary and approved asset IDs.
- Use visual causality, not decoration: show the cue, action, and result rather than a random stick figure.
- Avoid literalising every word. Alternate characters, diagrams, labels, and simple metaphors.
- Keep scene duration generally between 2.5 and 8 seconds; split longer scenes at an idea change.
- Every scene specifies an accessible caption and alt-style description for internal review.

### Short extraction workflow

1. Select self-contained moments that start with tension or curiosity.
2. Rewrite the opening for an immediate hook when necessary.
3. Rebuild the scene composition for 9:16; do not simply crop 16:9.
4. Add burn-in captions, concise on-screen text, and an end card/CTA.
5. Export variants with platform-safe framing and no watermarks.

## 12. Technical architecture and stack

> **Build note.** For the actual one-shot build, **Appendix A** collapses this to a single TypeScript runtime (Next.js + Remotion + FFmpeg). The split-runtime design below (Next.js + Python/FastAPI + Node render worker) is the **scale-up target**, not the MVP — implement Appendix A, treat this section as where it grows.

### Recommended local-first architecture

```text
Next.js / React editor
        ↕ HTTP + WebSocket job updates
FastAPI application and job orchestrator
        ├─ SQLite (MVP) / PostgreSQL (scale): projects, scripts, scenes, metadata
        ├─ Local file storage: sources, SVG assets, audio, renders, exports
        ├─ Vector search: source chunks and retrieval metadata
        ├─ AI provider adapter: LLM, embeddings, TTS
        ├─ Render worker: SVG / Remotion or equivalent + FFmpeg
        └─ QA services: style validation, timing, captions, source support
```

### Stack choices

| Layer | MVP recommendation | Why |
|---|---|---|
| Web app | Next.js + React + TypeScript | Fast local interface and mature component ecosystem |
| Styling | Tailwind CSS + design tokens | Makes the studio UI consistent and maintainable |
| API | Python FastAPI | Excellent for AI, file processing, and render orchestration |
| Project DB | SQLite, migrate later to PostgreSQL | Simple local setup; clear growth path |
| Background jobs | Local worker + Redis when concurrency needs it | Rendering and AI calls must not block the UI |
| Source search | Embeddings + local vector index | Grounded script generation over approved source text |
| Animation | SVG components + Remotion (deterministic per-frame render) | Precise, reusable, editable whiteboard scenes; preview = final (§13.2) |
| Video assembly | FFmpeg | Encode profiles per platform, `loudnorm`, packaging (§13.2, §13.3) |
| OCR | A local/OCR service adapter | Supports scanned inputs with review safeguards |
| Narration | Pluggable TTS provider | Audio-first timing, SSML, LUFS mastering; per-project voice (§13.3) |
| Music | Licensed catalogue adapter + ducking bus | Structure-aligned bed, sidechained under voice (§13.4) |
| Captions | Forced aligner (WhisperX/aeneas) + SRT/VTT + burn-in | Word-level timing; sidecar for long-form, kinetic burn-in for shorts (§13.5) |
| Audio QA | FFmpeg `loudnorm`/`ebur128` | Loudness, true-peak, sync-drift gates before export (§13.6) |
| Storage | Local project folders first; object storage later | Easy backups and transparent files |

### Key data entities

- `Project`, `Source`, `SourceSection`, `Claim`, `EditorialBrief`, `ScriptVersion`
- `Storyboard`, `Scene`, `Asset`, `StyleProfile`, `VoiceProfile`, `AudioCue`
- `RenderJob`, `Export`, `PublishingPack`, `ReviewIssue`, `Approval`

### Project directory concept

```text
project/
  source/            # imported text and extraction metadata
  knowledge/         # chunks, summaries, claim references
  editorial/         # brief and script versions
  storyboard/        # structured scene data
  assets/            # project-specific approved assets
  audio/             # narration, music, cues
  renders/           # previews and final output
  exports/           # platform packages
  manifest.json      # project settings, provenance, status
```

## 13. Production quality engine (video, audio, music, subtitles)

Section 12 names the components; this section defines how they combine into output that reads as *premium* rather than "AI slop." Quality is a property of the whole pipeline, so it is specified as **measurable bars** that QA (section 8 checks plus 13.6) enforces before export. Nothing here changes the `whiteboard_v1` look — it defines how faithfully and cleanly that look is produced.

### 13.1 Quality bars — what "high quality" means, measurably

| Pillar | Target | Fail condition |
|---|---|---|
| Video | 1080p master, crisp anti-aliased line art, no dropped/duplicated frames, deterministic re-render | Banding, aliased strokes, stutter, frame diff > 0 on identical re-render |
| Motion | Draw-on and easing feel hand-paced; a meaningful change every 2–4 s | Robotic linear tweens, dead frames > 5 s, motion outside `whiteboard_v1` |
| Voice | Natural neural TTS, correct pronunciation of names/terms, no clipping | Mispronounced source terms, audible artefacts, true peak > −1 dBTP |
| Music | Licensed bed, ducked under voice, aligned to structure, clean fades | Unlicensed/flaggable track, music masking speech, hard cut at end |
| Subtitles | Word-accurate timing, inside safe area, readable speed | Drift > 150 ms, > 17 cps, overlaps face/action, > 2 lines |
| Loudness | Integrated loudness on platform target, consistent across a video | Off-target LUFS, inter-scene loudness jumps |

### 13.2 Render engine and video quality

**Engine.** Remotion (React + headless Chromium, one deterministic frame at a time) is the primary renderer: the SVG scene components from section 8 are the *same* assets the editor previews, so preview and final render cannot diverge. Frames are piped to FFmpeg for encoding. A project + seed always produces identical frames — this is what makes style-profile reproduction (section 7.7) real rather than aspirational.

**The "drawn live" effect** is the single biggest quality lever for this style and the hardest to fake convincingly:

- Strokes draw on by animating SVG `stroke-dashoffset` from full length to 0 over 250–600 ms with an ease-out curve; the path's own length sets pacing, so long lines take longer — matching a real marker.
- An optional hand + marker-tip sprite follows the drawing point (the path tangent) so the audience sees *what* is drawing; lifted between strokes.
- Hand-drawn wobble (the 1–2 px from 7.3) is a deterministic seed-based per-vertex perturbation applied **once per asset instance** — not re-randomised per frame, which would shimmer. Same seed → same wobble → reproducible.
- Erase/reveal transitions animate a mask, not opacity, so they read as wiping, not fading.

**Render settings.**

- 30 fps baseline; 60 fps for motion-dense shorts. No motion blur — line art must stay crisp.
- Supersample: render at 1.5×–2× then downscale to 1080p (Lanczos). Thin ink strokes alias badly at 1×; supersampling is the cheapest large gain in perceived crispness.
- Fixed sRGB, `whiteboard_v1` tokens only. Optional very-faint static paper grain is a `whiteboard_v1` exception flag, off by default (respects 7.3's "no photographic textures").
- All text and captions render in-composition as vectors, never composited as raster afterthoughts, so they stay razor-sharp at every scale.

**Encoding (FFmpeg), per target:**

| Target | Codec / profile | Rate control | Pixel fmt | Extra |
|---|---|---|---|---|
| Master (archival) | H.264 High / x264 | CRF 16–18 | yuv420p | `-movflags +faststart`, 48 kHz AAC 320k |
| YouTube 16:9 | H.264 High | 2-pass ~16 Mbps 1080p | yuv420p | keyint 2×fps, faststart |
| Shorts / Reels / TikTok 9:16 | H.264 High | 2-pass ~12–14 Mbps | yuv420p | ≤ 60 s where required, loudness-normalised |

Keep the CRF master as the source of truth and derive platform encodes from it, so a codec/setting change never means re-animating.

### 13.3 Voice and audio production

**TTS.** A pluggable top-tier neural provider (adapter from section 12) with SSML control of pace, emphasis, and pauses. A per-project **pronunciation dictionary** (with phoneme overrides) fixes author names, book titles, and domain terms once and reuses them everywhere. Narration is generated per line/segment, not as one monolithic track, so a single fix re-renders one clip and keeps cost and edit-friction low.

**Audio-first timing.** The pipeline generates narration first, measures each clip's true duration, and snaps scene durations to `spoken length + visual-beat padding`. This removes the classic AI-video failure where narration and animation drift apart: the picture is built to the voice, not guessed and then patched.

**Per-clip chain.** High-pass ~80 Hz → light de-ess → gentle compression (2–3:1) → clip normalise. Consistent input before anything reaches the mix bus.

**Sound design.** Cues come only from the approved library (7.6): marker scratch keyed to the draw-on, soft pop on an emphasis bounce, tick/ding on reveals. Effects sit well under the voice and never compete with it.

**Loudness (the audio quality standard).** Master to integrated-loudness targets with true peak ≤ −1 dBTP, and keep loudness consistent scene-to-scene:

| Target | Integrated | True peak |
|---|---|---|
| YouTube long-form | −14 LUFS | ≤ −1 dBTP |
| Shorts / Reels / TikTok | −14 LUFS | ≤ −1 dBTP |
| Music bed under speech | −20 to −24 LUFS | — |

Measure with FFmpeg `loudnorm` (EBU R128) in the QA pass and re-normalise, rather than trusting fader positions.

### 13.4 Music system

- **Sourcing & rights.** Licensed / royalty-free catalogue only, with the track licence stored in the project manifest (ties to section 15). Never use platform-flaggable music — a Content-ID strike is a production outage.
- **Selection.** Match mood/tempo tags to the brief's tone (section 11 brief). Long-form uses a low-energy bed; a small punchier "shorts set" is kept separate.
- **Arrangement, not just a loop.** Short intro sting → low bed under teaching → subtle lift at the takeaway/CTA → clean fade or resolved tail. Trim/loop to exact length; never hard-cut music at the end.
- **Structure alignment.** Detect BPM/bar length and snap the hook and major beat transitions to phrase boundaries where feasible — cheap, and it is most of why edited video "feels" produced.
- **Mix.** Sidechain-duck music (and SFX) under narration by −12 to −18 dB, automated from the VO envelope, so speech is always the clearest element.

### 13.5 Subtitles and captions

Two separate deliverables, often confused:

- **Burn-in captions** — part of the visual identity, styled in `whiteboard_v1`, mainly for short-form where platforms handle sidecar files unreliably.
- **Sidecar SRT/VTT** — always shipped for long-form (accessibility, SEO, platform upload); the base for translated tracks later (section 19).

**Timing.** Because the voice is TTS from known text, forced alignment (WhisperX / aeneas / gentle) against the generated audio yields word-level timestamps at high accuracy — enabling karaoke-style active-word highlighting rather than dumb block captions.

**Style & readability.**

- Body caption font is the legible sans (7.4), not the marker face; 1–2 lines; bottom 12% safe area on 9:16.
- Long-form: full-sentence lower-third. Short-form: kinetic 2–4-word chunks with the active word highlighted in an accent token (idea yellow / learning blue), consistent with the colour-meaning rules.
- Reading-speed lint: ≤ ~17 characters/second, a minimum on-screen duration per cue, and a max line length — auto-flag violations.

**QA.** Reuses the style checks (7.7: no overlap with face/action, inside safe area) plus timing-drift and reading-speed lint.

### 13.6 Production QA (audio/video), extending section 8

Before export, in addition to the visual/style/source checks already defined, automatically verify and **block on failure**:

- **Loudness & peaks:** integrated LUFS on target ± tolerance, true peak ≤ −1 dBTP, no inter-scene loudness jumps.
- **Sync drift:** voice ↔ caption ↔ on-screen action within ±120 ms at every scene boundary.
- **Frame integrity:** no dropped or duplicated frames; render matches the composition frame count.
- **Determinism:** golden-frame hash diff against the previous render of an unchanged project is identical (proves reproducibility).
- **Platform spec:** resolution, fps, duration limits, container, and bitrate valid for each selected target before the encode is accepted.

## 14. Publishing and channel workflow

### Per-book production loop

1. Choose a source that fits the channel and has an acceptable rights position.
2. Define one core audience promise, not “summarise the whole book.”
3. Produce and approve the 5–10 minute master video.
4. Create 5–15 short-form candidates from individual lessons, myths, analogies, or contrarian insights.
5. Render platform-specific vertical versions and subtitles.
6. Prepare thumbnail, title variants, description, relevant affiliate disclosure, chapters, hashtags, and pinned-comment copy.
7. Publish on a consistent cadence; record performance after 48 hours, 7 days, and 28 days.
8. Feed learnings into the hook template, script pacing, and asset library—not into uncontrolled style changes.

### Platform export specifications

| Platform | Main format | Output requirements |
|---|---|---|
| YouTube long-form | 16:9, 1080p | Master MP4, thumbnail, chapters, description, subtitles |
| YouTube Shorts | 9:16, 1080×1920 | 30–90 sec cut, burn-in captions, hook-first edit |
| Instagram Reels | 9:16, 1080×1920 | Safe lower area, concise caption, cover image |
| TikTok | 9:16, 1080×1920 | Captions, quick hook, native-sounding title/caption |

Do not use the same text or timing blindly on every platform. Keep the visual identity fixed while adapting opening hook, caption copy, CTA, and safe areas.

### Discovery and metadata optimization

Packaging — the title, the thumbnail, and the first three seconds — decides views more than anything downstream, so it is generated as a **first-class, ranked deliverable**, not an afterthought. The generator optimises for clicks *and* honesty: no title or thumbnail may promise something the video does not deliver (section 15 guardrails).

**Per-platform targets**

| Platform | Ranked mainly on | Generate |
|---|---|---|
| YouTube long-form | search relevance + thumbnail CTR + watch time | keyworded title (≤ ~60 chars, keyword front-loaded), 3–6-word thumbnail copy, description with hook line + chapters + links + 3–5 tags, pinned comment |
| YouTube Short | first-frame stop rate + completion | on-screen title (frame 1), short native title, 2–4 hashtags |
| Instagram Reel | cover + caption + completion | cover frame, concise caption with one hook line, hashtags |
| TikTok | first-second hook + completion + shares | native-sounding caption, on-screen hook text, relevant sounds (licensed only) |

**Title generation.** Produce several variants across proven angles — curiosity gap, number/list, contrarian, clear benefit, "how to X without Y" — each within the platform's length limit, keyword front-loaded for YouTube search. Rank by predicted relevance/CTR and present the top options; the creator picks. Never generate a title that misstates the book or the video.

**Thumbnail (long-form).** One focal stickman + one accent colour + 3–6 high-contrast words, reusing `whiteboard_v1` tokens so thumbnails read as a set. Produce 2–3 variants for A/B testing (section 19).

**Description.** First 1–2 lines carry the hook and primary keyword (all that shows in search/suggested); then a short value summary, chapters/timestamps for long-form, affiliate disclosure where relevant, links, and 3–5 genuinely relevant hashtags. No keyword stuffing.

**Feedback loop.** Import CTR, average view duration, and retention (metrics below), learn which title angles, hooks, and thumbnail styles actually win for this channel, and feed that back into the ranked suggestions — always as optional guidance, never as an automatic style change (section 19).

### Metrics to track

- Long-form: impressions, click-through rate, average view duration, average percentage viewed, returning viewers, subscriber conversion.
- Short-form: viewed versus swiped away, average watch duration, completion, rewatches, shares, saves, follows.
- Business: affiliate clicks/conversion, sponsor inquiries, production cost per video, time per approved video, revenue per thousand views.

## 15. Monetisation strategy

Build multiple revenue streams; do not rely only on short-form ad revenue.

1. **Platform advertising:** long-form YouTube is likely the steadier base once eligibility and watch time are established.
2. **Affiliate links:** books, audiobooks, note-taking tools, productivity tools, and courses—clearly disclosed and genuinely relevant.
3. **Sponsorships:** aligned learning, reading, productivity, or education brands after consistent audience fit develops.
4. **Digital products:** reading guides, implementation templates, curated learning paths, or a membership library of original explainers.
5. **Licensing / services:** custom educational explainers for authors, educators, or businesses, with clear content rights.
6. **SaaS later:** only after the internal studio is stable, legally sound, and demonstrably useful.

### Monetisation guardrails

- Never let a sponsor dictate an inaccurate interpretation of a book.
- Disclose affiliate relationships and sponsorships clearly.
- Avoid making earnings claims in content without current evidence and context.
- Treat the audience’s trust and the channel style as more valuable than a one-off deal.

## 16. Copyright, permissions, and safety

This plan is operational guidance, not legal advice. Obtain qualified legal advice before commercialising at scale or relying on an exception such as fair dealing/fair use.

### Default policy

- Use public-domain, licensed, creator-owned, or permissioned material for early production whenever possible.
- For copyrighted books, create genuinely transformative commentary and teaching in original language.
- Use only short quotations when editorially necessary; retain source and attribution records.
- Do not scan/upload/distribute books without a lawful basis; do not expose source text through a public product.
- Do not recreate chapters, dialogue, prose style, illustrations, or scene-by-scene narrative in a way that substitutes for the work.
- Fiction content needs stronger review because plot retelling, character depiction, and spoilers increase risk.
- Include human review and a rights-status field before rendering or publishing.

### Rights status values

`public_domain`, `licensed`, `creator_owned`, `permission_confirmed`, `commentary_review_required`, `do_not_use`.

### Additional content safety

- Flag medical, legal, investment, mental-health, and other high-stakes claims for specialist review and appropriate disclaimers.
- Cite research responsibly; distinguish book claims from independently verified facts.
- Do not clone a real narrator’s voice without explicit permission.
- License music, fonts, sound effects, and any third-party visual asset.

## 17. Milestones and success measures

### First 30 days — prove the style

- Finalise `whiteboard_v1` tokens and create the starter asset pack.
- Make three manually edited pilot Shorts and one 3–5 minute pilot.
- Test different hooks, not different visual identities.
- Document every repeated production task.

**Success:** strangers can recognise the visual style, understand the lesson, and the creation process exposes the right automation priorities.

### Days 31–60 — build the script-to-storyboard core

- Implement project/source/brief/script workflow.
- Add source-grounded generation and review flags.
- Implement structured scene cards, timeline editing, and SVG asset selection.
- Produce five videos with the internal workflow.

**Success:** a script and storyboard can be approved quickly with no lost source provenance.

### Days 61–90 — render and publish

- Add voice, captions, basic scene rendering, audio mix, and export profiles.
- Automate thumbnail/copy drafts and short-form derivative projects.
- Track production time, quality issues, and audience data.

**Success:** one editor can release at least one strong long video plus several shorts weekly without compromising the style rules.

### Six-month target

- A stable, versioned asset library.
- Predictable production throughput and a reviewable back catalogue.
- Clear evidence of which topics, hooks, and video lengths build returning viewers.
- A decision backed by data: remain a media brand, add services, or validate a SaaS beta.

## 18. Key risks and mitigations

| Risk | Why it matters | Mitigation |
|---|---|---|
| Copyright / source misuse | Could create legal and platform risk | Rights log, transformative-commentary policy, human review, public-domain pilots |
| Hallucinated claims | Erodes trust | Source-linked claims, confidence flags, editor approval |
| No-manuscript generation | Title+author input has no source text to ground against | Reference-only mode: public-verifiable facts only, label ungrounded claims, restrict to premise/theme, no invented quotes or plot detail, mandatory human fact-check (§10) |
| Generic AI scripts | Low retention and weak brand | Strong editorial brief, examples, opinionated teaching angle, iterative human editing |
| Visual inconsistency | Damages recognisability | Locked style profile, approved library, automated linting |
| Rendering complexity | Can delay releases | Start with limited scene/action vocabulary and deterministic SVG rendering |
| Platform volatility | Reach/revenue can change | Build email list, long-form library, multi-platform exports, diverse revenue |
| Cost creep | AI/TTS/render costs may scale | Cache outputs, reuse assets, queue renders, track cost per finished minute |
| Over-automation | Poor judgement reaches the audience | Explicit approval gates; publishing stays human-controlled |

## 19. Future features

- Manual scene editor with direct manipulation, keyframes, and reusable scene templates.
- Multiple language tracks with translated—not merely dubbed—scripts and localised visuals.
- Voice pronunciation dictionary and custom approved voice profiles.
- Analytics-informed hook and pacing suggestions, always optional.
- A/B thumbnail and title workbench.
- Collaboration roles: writer, fact reviewer, animator, publisher.
- Educational worksheets, quizzes, and companion newsletters generated from approved scripts.
- Asset marketplace or commissioned asset workflow, only with strict style validation and licensing.
- Cloud rendering, team workspaces, and SaaS billing after local workflow validation.

## 20. Decision log to maintain

Keep a simple living decision log beside the project:

- Which source categories are permitted?
- What is the channel’s precise editorial promise?
- What does `whiteboard_v1` include and explicitly exclude?
- Which AI and voice providers are approved?
- Which human review steps are mandatory?
- What production cadence is sustainable?
- Which metrics decide whether a format should be continued, improved, or retired?

## 21. Immediate next actions

1. Choose the channel name, target viewer, and initial niche (for example: practical non-fiction ideas for busy adults).
2. Adopt `whiteboard_v1` unchanged for the first 10 videos.
3. Create the starter SVG asset library: learner, guide, 15 poses, 30 props, 10 diagrams, and 5 backgrounds.
4. Select a public-domain, licensed, or creator-owned first source.
5. Produce one 60-second teaching Short manually from a structured storyboard; use it as the visual benchmark.
6. Build Phase 1 around the real pain encountered in that pilot rather than around speculative features.

---

**North-star test:** a viewer sees a clean whiteboard stickman scene, understands a useful idea in seconds, and knows it came from this channel—while the creator can make the next video faster without sacrificing accuracy, rights, or personality.

---

# Appendix A — One-shot build specification (implement this)

Sections 1–21 are product context and rationale. **This appendix is the executable contract.** A coding agent should build exactly what is here, in the order in A.11, and stop at the boundary in A.1. Everything not listed as *in scope* is deliberately deferred — do not build it.

> Reality check: the full product (100+ assets, OCR/EPUB, RAG, multi-platform A/B, analytics, accounts, cloud render, SaaS) **cannot be reliably produced in one pass.** This appendix defines the smallest app that runs the pipeline end-to-end — source in → whiteboard video + captions + music + publishing pack out — on a single machine. Get this running first; grow it via sections 5 and 12.

## A.1 One-shot scope

**In scope (v1, build this):**

- Create a project. Input is **either** pasted text/Markdown notes **or** a book title + author (reference-only mode, section 10 — output flagged unverified).
- LLM generates: editorial brief → script (for a chosen target) → storyboard JSON constrained to the built-in asset vocabulary.
- Built-in **starter asset set** as Remotion/React SVG components: 1 learner character with 6 poses, ~10 props/icons (book, phone, arrow, checkbox, lightbulb, graph, coin, clock, brain, ladder), 3 backgrounds. Enough to render; not the full library.
- Remotion composition renders scenes: stroke draw-on, on-screen text, one transition set, burn-in captions.
- TTS narration per scene via a pluggable provider (audio-first timing, section 13.3).
- One licensed music bed dropped in `public/music/`, mixed and ducked under the voice (section 13.4).
- Captions from TTS-segment timing → burn-in **and** exported `.srt`.
- FFmpeg mux + loudness-normalised encode in **16:9 and 9:16** presets (section 13.2).
- Publishing pack: ranked titles, description, tags, thumbnail copy → `pack.json` + `pack.md` (section 14 discovery).
- Local project folders (section 12 layout) + a SQLite index.
- Minimal web UI: projects list → new project (input + target) → review script → review storyboard → render → results (video, captions, pack).

**Out of scope (deferred — do not build in the one-shot):** OCR/EPUB/PDF extraction (accept pasted text/Markdown only); vector search/RAG (stuff source into context, note the seam); the full 100+ asset library and pose sheets; forced alignment (WhisperX) — use TTS-segment timing; the full style linter (implement the two cheap checks in A.7); job queue/Redis, PostgreSQL, accounts/billing, cloud render, analytics import, A/B thumbnail UI, multi-language. These map to sections 5 and 19.

## A.2 Stack — single TypeScript runtime

| Concern | Choice | Notes |
|---|---|---|
| App + API | Next.js 14 (App Router) + React 18 + TypeScript | UI and route handlers in one process |
| Styling | Tailwind CSS | studio UI |
| Animation/render | Remotion 4 | React components → frames; deterministic |
| Video assembly | FFmpeg (via `ffmpeg-static`, override with `FFMPEG_PATH`) | mux, duck, `loudnorm`, encode |
| Metadata DB | `better-sqlite3` | index only; project data lives as JSON in the project folder |
| Validation | Zod | LLM output contract (A.5) |
| LLM | adapter; default Anthropic `claude-sonnet-5` | provider chosen by env |
| TTS | adapter; default ElevenLabs | provider chosen by env (Anthropic has no TTS) |

No Python, no separate render worker, no message broker in v1.

## A.3 Repository structure

```text
whiteboard-studio/
  app/
    page.tsx                     # projects list
    project/new/page.tsx         # input + target picker (Quick create, §6)
    project/[id]/page.tsx        # review script → storyboard → render → results
    api/
      projects/route.ts          # POST create, GET list
      generate/route.ts          # POST → brief, script, storyboard.json (LLM)
      narrate/route.ts           # POST → per-scene audio (TTS) + durations
      render/route.ts            # POST → Remotion render + FFmpeg mux/encode
      pack/route.ts              # POST → titles/description/tags/thumbnail copy
  remotion/
    Root.tsx                     # registerRoot(Root)
    Whiteboard.tsx               # <Composition/> for 16:9 and 9:16
    Scene.tsx                    # renders one storyboard scene
    components/StrokePath.tsx    # draw-on stroke (A.7)
    components/Caption.tsx       # kinetic burn-in caption
    style/whiteboard_v1.ts       # tokens, stroke width, easing (§7)
  assets/
    manifest.json                # asset registry (ids the LLM may use)
    characters/*, props/*, backgrounds/*   # SVG React components
  lib/
    db.ts                        # better-sqlite3 open + migrate
    schema.ts                    # Zod: Storyboard, Scene, Pack (A.5)
    llm.ts                       # LLM adapter (A.8)
    tts.ts                       # TTS adapter (A.8)
    ffmpeg.ts                    # mux/duck/loudnorm/encode (A.7)
    project.ts                   # project-folder IO (§12 layout)
    prompts/                     # brief.md, script.md, storyboard.md, pack.md
  public/music/                  # user-provided licensed bed(s)
  scripts/smoke.ts               # A.10 acceptance check
  fixtures/sample-source.md      # fixed input for the smoke test
  .env.example
  package.json
```

## A.4 Data model

SQLite is an index only; the source of truth is files in the project folder (section 12 layout).

```sql
CREATE TABLE project (
  id TEXT PRIMARY KEY,           -- uuid
  title TEXT NOT NULL,
  author TEXT,
  input_mode TEXT NOT NULL,      -- 'text' | 'reference_only'
  target TEXT NOT NULL,          -- 'yt_long' | 'yt_short' | 'reel' | 'tiktok'
  status TEXT NOT NULL,          -- 'created'|'scripted'|'storyboarded'|'narrated'|'rendered'|'packaged'
  dir TEXT NOT NULL,             -- project folder path
  created_at TEXT NOT NULL
);
```

Per-project files: `manifest.json`, `source/source.md`, `editorial/brief.json`, `editorial/script.json`, `storyboard/storyboard.json`, `audio/scene_*.mp3`, `renders/master.mp4`, `exports/{16x9,9x16}.mp4`, `exports/captions.srt`, `exports/pack.json`, `exports/pack.md`.

## A.5 LLM output contract (the part one-shots fail without)

The storyboard the LLM returns MUST validate against this Zod schema. Pass `assets/manifest.json` ids into the prompt; validate every `asset` ref against the registry — unknown ref → replace with `placeholder` + `review_status: 'needs_review'`. Reject and re-ask once on validation failure.

```ts
// lib/schema.ts
import { z } from "zod";

export const Scene = z.object({
  scene_id: z.number().int(),
  duration_seconds: z.number().min(1).max(12),
  narration: z.string().min(1),
  on_screen_text: z.string().max(60).default(""),
  purpose: z.enum(["hook","explain","contrast","demonstrate","recap","transition"]),
  characters: z.array(z.string()).default([]),   // must be manifest ids
  props: z.array(z.string()).default([]),         // must be manifest ids
  background: z.string(),                          // must be manifest id
  action: z.string(),
  transition_in: z.enum(["cut","marker_wipe","slide","zoom","erase_reveal"]).default("cut"),
  accent: z.enum(["blue","green","red","yellow","none"]).default("none"),
  claim_kind: z.enum(["fact","interpretation","general_advice","creative_example"]),
  source_refs: z.array(z.string()).default([]),
  review_status: z.enum(["ok","needs_review"]).default("ok"),
});

export const Storyboard = z.object({
  target: z.enum(["yt_long","yt_short","reel","tiktok"]),
  style_profile: z.literal("whiteboard_v1"),
  scenes: z.array(Scene).min(1),
});

export const Pack = z.object({
  titles: z.array(z.object({ text: z.string(), angle: z.string(), score: z.number() })).min(3),
  description: z.string(),
  tags: z.array(z.string()).max(15),
  thumbnail_copy: z.string().max(40),   // long-form only
});
```

Word budget: 130–155 wpm (section 11) → the generator sizes total narration to the target duration.

## A.6 API routes (Next.js route handlers)

| Route | Method | Does |
|---|---|---|
| `/api/projects` | POST / GET | create project (scaffold folder + row) / list |
| `/api/generate` | POST | source → brief → script → `storyboard.json` (validated A.5) |
| `/api/narrate` | POST | per-scene TTS → `audio/scene_*.mp3`, write real durations back to storyboard (audio-first) |
| `/api/render` | POST | Remotion render at target aspect → FFmpeg duck+loudnorm+encode → `exports/*.mp4` + `captions.srt` |
| `/api/pack` | POST | script + target → ranked titles/description/tags/thumbnail copy → `pack.json`/`pack.md` |

Long steps stream status; UI polls project `status`. No queue in v1.

## A.7 Render pipeline — the two crux pieces

**Draw-on stroke** (the whole look depends on this; section 13.2):

```tsx
// remotion/components/StrokePath.tsx
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export const StrokePath: React.FC<{
  d: string; length: number; startF: number; durF: number; color: string; width?: number;
}> = ({ d, length, startF, durF, color, width = 8 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [startF, startF + durF], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 3), // ease-out, matches a real marker
  });
  return (
    <path d={d} fill="none" stroke={color} strokeWidth={width}
      strokeLinecap="round" strokeLinejoin="round"
      strokeDasharray={length} strokeDashoffset={length * p} />
  );
};
// wobble: perturb path vertices ONCE per instance with a seeded RNG (deterministic), not per frame.
```

**FFmpeg** (section 13.2/13.3): render scenes → concat → duck music under VO → loudnorm → encode.

```bash
# duck music under narration and mix, then loudness-normalise to -14 LUFS, -1 dBTP
ffmpeg -i video.mp4 -i voice.wav -i public/music/bed.mp3 -filter_complex \
 "[2:a]volume=0.25[m];[1:a][m]sidechaincompress=threshold=0.03:ratio=8:release=300[mix];\
  [mix]loudnorm=I=-14:TP=-1:LRA=11[a]" \
 -map 0:v -map "[a]" -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 18 \
 -movflags +faststart out_16x9.mp4
# 9:16 preset: render the Composition at 1080x1920 (do NOT crop) and encode the same way.
```

**Two cheap style checks (the only linting in v1):** reject a scene with `accent` set on > 1 non-`none` value beyond the allowed problem/solution pair; reject `on_screen_text` longer than 60 chars. Everything else in section 7.7 is deferred.

## A.8 AI adapters

```ts
// lib/llm.ts
export interface LLM { generate(system: string, user: string, json?: boolean): Promise<string>; }
// lib/tts.ts
export interface TTS { synthesize(text: string, outPath: string): Promise<{ seconds: number }>; }
```

Default impls: Anthropic (`claude-sonnet-5`) for `LLM`; ElevenLabs for `TTS`. Provider selected by env (A.9). Prompts live in `lib/prompts/*.md` and are versioned with the repo. The generator retrieves the source by stuffing `source/source.md` into context (RAG is deferred; note the seam in `generate/route.ts`).

## A.9 Environment and run

```dotenv
# .env.example
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-5
TTS_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
# optional: OPENAI_API_KEY=   FFMPEG_PATH=
```

```bash
npm install
cp .env.example .env      # fill keys, drop a licensed track in public/music/
npm run dev               # studio at http://localhost:3000
npm run smoke             # A.10 end-to-end acceptance check
```

A fresh clone + keys + one music file must be able to produce a video with no code edits.

## A.10 Acceptance smoke test (the one runnable check)

`scripts/smoke.ts` (run by `npm run smoke`) drives the full pipeline on `fixtures/sample-source.md` targeting `yt_short` and asserts:

- `storyboard.json` validates against the Zod schema and every asset ref exists in the manifest.
- one `audio/scene_*.mp3` exists per scene, each with `seconds > 0`.
- `exports/9x16.mp4` exists, is 1080×1920, has an audio stream, and duration is within ±15% of the summed scene durations (via `ffprobe`).
- integrated loudness is within −14 ± 1.5 LUFS (via `ffmpeg loudnorm` measurement pass).
- `captions.srt` parses and its last cue end-time is ≤ video duration.
- `pack.json` validates and has ≥ 3 titles.

The test uses a stub LLM/TTS when `SMOKE_STUB=1` (fixed storyboard + a short beep for audio) so it runs in CI without API keys; with keys set it runs the real providers.

## A.11 Build order for the agent

1. Scaffold Next.js + Tailwind + `better-sqlite3`; `lib/db.ts` migration (A.4). **Verify:** app boots, DB file created.
2. `lib/schema.ts` (Zod) + `assets/manifest.json` + the starter SVG components. **Verify:** manifest ids resolve to components.
3. `remotion/` composition + `StrokePath` + `Scene` + `Caption` rendering a hardcoded storyboard. **Verify:** `remotion render` produces frames/mp4.
4. `lib/llm.ts` + prompts + `/api/generate` producing a schema-valid storyboard from `fixtures/sample-source.md`. **Verify:** Zod passes, asset refs valid.
5. `lib/tts.ts` + `/api/narrate` (audio-first: write real durations back). **Verify:** one mp3 per scene, durations updated.
6. `lib/ffmpeg.ts` + `/api/render` (duck, loudnorm, 16:9 and 9:16, SRT). **Verify:** `exports/*.mp4` + `captions.srt` exist and play.
7. `/api/pack` + `pack.md/json`. **Verify:** ≥ 3 ranked titles, description, tags.
8. Minimal UI wiring the five steps + status polling (§6 Quick create flow).
9. `scripts/smoke.ts` (A.10). **Verify:** `npm run smoke` green with `SMOKE_STUB=1`.

## A.12 Deviations from Section 12, and why

| Section 12 (scale target) | Appendix A (one-shot) | Why |
|---|---|---|
| Python FastAPI backend | Next.js route handlers | one runtime; Remotion is Node/React already — a Python boundary is pure integration risk in a one-shot |
| Redis + worker queue | inline route handlers, status polling | no concurrency need at one machine, one creator |
| Embeddings + vector index | source stuffed into context | RAG is a hardening step; note the seam, don't block v1 |
| 100+ asset library | ~20 built-in components | enough to render; grow via section 8 governance |
| Forced alignment captions | TTS-segment timing | word-accuracy is a later upgrade; segment timing renders now |

Grow each row toward Section 12 only after the smoke test in A.10 is green.

## A.13 Starter artifacts (verbatim)

Copy these in as-is; they remove the remaining guesswork. Prompts are self-contained (the runtime LLM does **not** see this plan) and use `{{PLACEHOLDER}}` tokens that the named route fills before the call. Storyboard and pack prompts must be called in JSON mode.

**What the builder still authors** (not pinned here, on purpose): the SVG paths inside each asset component; the bodies of `db.ts`, `project.ts`, `ffmpeg.ts`, `llm.ts`, `tts.ts`; the UI pages; `Root.tsx`; `Caption.tsx`. The contracts below are enough to write them without guessing.

### `package.json`

```json
{
  "name": "whiteboard-studio",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "studio": "remotion studio remotion/Root.tsx",
    "smoke": "tsx scripts/smoke.ts"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "remotion": "^4.0.0",
    "@remotion/bundler": "^4.0.0",
    "@remotion/renderer": "^4.0.0",
    "@anthropic-ai/sdk": "^0.32.0",
    "better-sqlite3": "^11.0.0",
    "zod": "^3.23.0",
    "ffmpeg-static": "^5.2.0",
    "ffprobe-static": "^3.1.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/better-sqlite3": "^7.6.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "tsx": "^4.16.0"
  }
}
```

TTS/ElevenLabs is called over `fetch` (no SDK dep). To default the LLM to OpenAI instead, add `openai` and branch in `lib/llm.ts` on `LLM_PROVIDER`.

### `assets/manifest.json`

The registry of ids the LLM may reference. The `/api/generate` route injects the flat id list into the storyboard prompt's `{{ASSET_IDS}}`.

```json
{
  "style_profile": "whiteboard_v1",
  "characters": [
    { "id": "learner", "poses": ["idle", "point", "think", "read", "celebrate", "confused"] }
  ],
  "props": [
    { "id": "book" }, { "id": "phone" }, { "id": "arrow" }, { "id": "checkbox" },
    { "id": "lightbulb" }, { "id": "graph" }, { "id": "coin" }, { "id": "clock" },
    { "id": "brain" }, { "id": "ladder" }
  ],
  "backgrounds": [
    { "id": "blank_board" }, { "id": "desk" }, { "id": "outdoor" }
  ],
  "placeholder": { "id": "placeholder" }
}
```

Flat id set given to the LLM = every `characters[].id` + `props[].id` + `backgrounds[].id` + `"placeholder"`. In a Scene, `characters` holds character ids (pose is chosen from `action` via `poseFor`, default `idle`), `props` holds prop ids, `background` is one background id.

**Asset component contract.** Each id maps to `assets/<category>/<id>.tsx` exporting:

```ts
type AssetProps = { accent: string; className?: string };            // props & backgrounds
type CharacterProps = AssetProps & { pose: string };                 // characters
```

Every asset is built from `StrokePath` primitives (A.7) sharing one draw-on window so it animates as one drawn object. `placeholder` is a dashed box labelled "asset" in ink.

### `fixtures/sample-source.md`

Original text (not copyrighted) so the smoke test needs no rights clearance.

```markdown
# Notes: designing your environment for better habits

The space around you quietly decides what you do next. A phone on the desk
invites a scroll; a book left open invites a page. Willpower is unreliable,
but layout is dependable — you can arrange a room so the good choice is the
easy one and the bad choice takes effort.

Three moves do most of the work. First, make the cue for a good habit
obvious: put the running shoes by the door. Second, add friction to a bad
habit: log out of the app, or leave the controller in another room. Third,
shrink the first step until it is almost too small to skip: read one page,
not one chapter.

The point is not motivation. It is that a small change to your surroundings
compounds every single day, because you meet that environment again tomorrow,
and the day after, without having to decide again.
```

### `remotion/style/whiteboard_v1.ts`

```ts
export const COLORS = {
  boardWhite: "#FAFAF7", ink: "#171717", charcoal: "#4A4A4A",
  blue: "#2F80ED", green: "#27AE60", red: "#EB5757", yellow: "#F2C94C",
} as const;

export const ACCENT = {
  blue: COLORS.blue, green: COLORS.green, red: COLORS.red,
  yellow: COLORS.yellow, none: COLORS.ink,
} as const;

export const STROKE = 8;
export const FPS = 30;
export const DIMS = {
  yt_long: { w: 1920, h: 1080 },
  yt_short: { w: 1080, h: 1920 },
  reel: { w: 1080, h: 1920 },
  tiktok: { w: 1080, h: 1920 },
} as const;

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
```

### `remotion/Scene.tsx` and `remotion/Whiteboard.tsx`

```tsx
// remotion/Scene.tsx
import { AbsoluteFill, Audio } from "remotion";
import { COLORS, ACCENT } from "./style/whiteboard_v1";
import { Caption } from "./components/Caption";
import { getBackground, getCharacter, getProp, poseFor } from "../assets"; // registry from manifest

export const Scene: React.FC<{ scene: any; audioSrc?: string }> = ({ scene, audioSrc }) => {
  const accent = ACCENT[scene.accent as keyof typeof ACCENT] ?? COLORS.ink;
  const Bg = getBackground(scene.background);
  const Char = scene.characters[0] ? getCharacter(scene.characters[0]) : null;
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.boardWhite }}>
      <Bg accent={accent} />
      {Char && <Char accent={accent} pose={poseFor(scene.action)} />}
      {scene.props.map((id: string) => { const P = getProp(id); return <P key={id} accent={accent} />; })}
      {scene.on_screen_text && <Caption text={scene.on_screen_text} accent={accent} />}
      {audioSrc && <Audio src={audioSrc} />}
    </AbsoluteFill>
  );
};
// ponytail: components self-position; add an anchor/grid layout only when scenes look crowded.
```

```tsx
// remotion/Whiteboard.tsx
import { Sequence } from "remotion";
import { Scene } from "./Scene";
import { FPS } from "./style/whiteboard_v1";

// inputProps: { storyboard, audio }  where audio[i] aligns to scenes[i]
export const Whiteboard: React.FC<{ storyboard: any; audio: string[] }> = ({ storyboard, audio }) => {
  let from = 0;
  return (
    <>
      {storyboard.scenes.map((s: any, i: number) => {
        const dur = Math.round(s.duration_seconds * FPS);
        const el = (
          <Sequence key={s.scene_id} from={from} durationInFrames={dur}>
            <Scene scene={s} audioSrc={audio[i]} />
          </Sequence>
        );
        from += dur;
        return el;
      })}
    </>
  );
};
// Root.tsx: register one <Composition> per DIMS target; calculateMetadata sums scene durations
// (*FPS) for durationInFrames and reads {storyboard, audio} from inputProps.
```

### `lib/prompts/brief.md`  → filled by `/api/generate`

```markdown
You are the editorial lead for an educational whiteboard-stickman channel.
Given the SOURCE and TARGET, produce a JSON editorial brief.

Return ONLY JSON:
{ "objective": string, "audience": string, "angle": string,
  "tone": "curious|calm|playful|direct|serious",
  "key_ideas": string[], "caveats": string[], "cta": string }

Rules:
- objective = the one thing the viewer should remember or do.
- 3–5 key_ideas, each supported by SOURCE.
- If INPUT_MODE is reference_only, keep key_ideas to widely-reported themes and
  claim nothing as fact you cannot support from general knowledge of the work.

TARGET: {{TARGET}}   INPUT_MODE: {{INPUT_MODE}}
SOURCE:
{{SOURCE}}
```

### `lib/prompts/script.md`  → filled by `/api/generate`

```markdown
You write ORIGINAL teaching scripts for a whiteboard-stickman channel.
Never reproduce source wording — explain in your own words.

Return ONLY JSON:
{ "sections": [ { "purpose": "hook|explain|contrast|demonstrate|recap|transition",
                  "narration": string } ] }

Rules:
- Open with a specific promise or tension, not a generic book intro.
- 130–155 spoken words per minute → total narration ≈ (DURATION_SECONDS/60) * 140 words.
- One clear takeaway per section; every line must be visualisable.
- Original wording only; a direct quote only if essential (<15 words, attributed).
- Include caveats when the source warrants; separate the author's idea from the channel's interpretation.

Target structure:
- yt_long: promise → why it matters → 3–5 ideas → caveats → recap → CTA
- yt_short | reel | tiktok: hook → one idea → example → takeaway

BRIEF: {{BRIEF}}
TARGET: {{TARGET}}   DURATION_SECONDS: {{DURATION}}
SOURCE:
{{SOURCE}}
```

### `lib/prompts/storyboard.md`  → filled by `/api/generate` (JSON mode)

```markdown
You are a storyboard artist for a whiteboard-stickman channel.
Convert the SCRIPT into scenes using ONLY the approved asset ids.

Return ONLY JSON matching this shape:
{ "target": "{{TARGET}}", "style_profile": "whiteboard_v1",
  "scenes": [ {
    "scene_id": int, "duration_seconds": number (2.5–8),
    "narration": string, "on_screen_text": string (<=60 chars),
    "purpose": "hook|explain|contrast|demonstrate|recap|transition",
    "characters": string[], "props": string[], "background": string,
    "action": string,
    "transition_in": "cut|marker_wipe|slide|zoom|erase_reveal",
    "accent": "blue|green|red|yellow|none",
    "claim_kind": "fact|interpretation|general_advice|creative_example",
    "source_refs": string[], "review_status": "ok|needs_review"
  } ] }

Hard rules:
- characters/props/background MUST be ids from APPROVED_ASSETS. If you need
  something not listed, use "placeholder" and set review_status = "needs_review".
- One accent per scene; a second only to contrast problem (red) vs solution (green).
  Meaning: blue = idea, green = desired action, red = obstacle, yellow = insight, none = neutral.
- Scene duration 2.5–8 s; split longer ideas at an idea change.
- Each scene's narration is a slice of the SCRIPT — do NOT invent new claims.
- on_screen_text: 3–7 words, sentence case, may be empty; never a full paragraph.
- Show visual causality (cue → action → result), not decoration.
- claim_kind = "fact" only if source-supported; otherwise interpretation / general_advice / creative_example.

APPROVED_ASSETS: {{ASSET_IDS}}
SCRIPT:
{{SCRIPT}}
```

### `lib/prompts/pack.md`  → filled by `/api/pack` (JSON mode)

```markdown
You are a growth editor. Produce discovery metadata that maximises clicks
WITHOUT misstating the video.

Return ONLY JSON:
{ "titles": [ { "text": string, "angle": string, "score": number (0–1) } ],  // >= 3
  "description": string, "tags": string[] (<=15), "thumbnail_copy": string (<=40 chars) }

Rules:
- Cover these title angles: curiosity gap, number/list, contrarian, clear benefit,
  "how to X without Y". Keyword front-loaded for yt_long (<=60 chars). Rank by
  predicted CTR in "score".
- description: first line = hook + primary keyword (all that shows in search);
  then a 1–2 sentence value summary; for yt_long add a "Chapters:" line placeholder;
  then 3–5 relevant hashtags. No keyword stuffing.
- thumbnail_copy is meaningful only for yt_long.
- Never promise something the SCRIPT does not deliver.

TARGET: {{TARGET}}
SCRIPT:
{{SCRIPT}}
```

With A.1–A.13 in hand, a builder has the scope, stack, schemas, prompts, registry, render primitives, commands, and a runnable acceptance check — everything an end-to-end one-shot needs.
