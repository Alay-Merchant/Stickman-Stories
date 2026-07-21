import {randomUUID} from "node:crypto";
import {existsSync, readFileSync, readdirSync} from "node:fs";
import {mkdirSync, writeFileSync} from "node:fs";
import path from "node:path";
import {z} from "zod";

import {getDb} from "./db";
import {renderStoryboard} from "./ffmpeg";
import {createLLM} from "./llm";
import {
  createProjectFiles,
  ensureProjectDirectories,
  getProjectPaths,
  readJsonFile,
  readProjectManifest,
  type InputMode,
  type ProjectManifest,
  type ProjectRecord,
  type ProjectStatus,
  writeJsonFile,
  writeProjectManifest,
} from "./project";
import {runQa} from "./qa";
import {segmentSource, sourceRefsForIndex} from "./source";
import {
  EditorialBrief,
  Pack,
  ProjectSettings,
  QaReport,
  RightsStatus,
  Script as ScriptSchema,
  Storyboard,
  Target,
  type EditorialBrief as BriefValue,
  type Pack as PackValue,
  type ProjectSettings as ProjectSettingsValue,
  type RightsStatus as RightsStatusValue,
  type Script as ScriptValue,
  type Storyboard as StoryboardValue,
  type Target as TargetValue,
} from "./schema";
import {createTTS} from "./tts";

export type Brief = BriefValue;
export type Script = ScriptValue;

type AssetManifest = {
  characters: Array<{id: string}>;
  props: Array<{id: string}>;
  backgrounds: Array<{id: string}>;
  placeholder: {id: string};
};

export type CreateProjectInput = {
  title: string;
  author?: string | null;
  sourceText?: string;
  inputMode?: InputMode;
  target: TargetValue;
  rightsStatus?: RightsStatusValue;
  settings?: Partial<ProjectSettingsValue>;
};

export type UpdateProjectInput = {
  title?: string;
  author?: string | null;
  sourceText?: string;
  inputMode?: InputMode;
  target?: TargetValue;
  rightsStatus?: RightsStatusValue;
  settings?: Partial<ProjectSettingsValue>;
};

const promptDir = path.join(process.cwd(), "lib", "prompts");
const assetManifestPath = path.join(process.cwd(), "assets", "manifest.json");
const MAX_TITLE_CHARACTERS = 200;
const MAX_AUTHOR_CHARACTERS = 200;
const MAX_SOURCE_CHARACTERS = 750_000;
const activeProjectOperations = new Set<string>();

const withProjectLock = async <T>(id: string, operation: string, run: () => Promise<T>): Promise<T> => {
  if (activeProjectOperations.has(id)) {
    throw new Error(`${operation} is already running for this project. Wait for it to finish before starting another step.`);
  }
  activeProjectOperations.add(id);
  try {
    return await run();
  } finally {
    activeProjectOperations.delete(id);
  }
};

const parseJson = (value: string, label: string): unknown => {
  const trimmed = value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`${label} did not return valid JSON: ${detail}`);
  }
};

const prompt = (name: string, replacements: Record<string, string>) => {
  const filePath = path.join(promptDir, `${name}.md`);
  let template = readFileSync(filePath, "utf8");
  for (const [token, value] of Object.entries(replacements)) {
    template = template.replaceAll(`{{${token}}}`, value);
  }
  return template;
};

const pretty = (value: unknown) => JSON.stringify(value, null, 2);

const readAssets = (): AssetManifest => JSON.parse(readFileSync(assetManifestPath, "utf8")) as AssetManifest;

const assetIds = () => {
  const manifest = readAssets();
  return [
    ...manifest.characters.map((asset) => asset.id),
    ...manifest.props.map((asset) => asset.id),
    ...manifest.backgrounds.map((asset) => asset.id),
    manifest.placeholder.id,
  ];
};

const ensureAssetVocabulary = (value: unknown, target: TargetValue): unknown => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const candidate = structuredClone(value) as Record<string, unknown>;
  const manifest = readAssets();
  const characters = new Set(manifest.characters.map((asset) => asset.id));
  const props = new Set(manifest.props.map((asset) => asset.id));
  const backgrounds = new Set(manifest.backgrounds.map((asset) => asset.id));
  const placeholder = manifest.placeholder.id;

  candidate.target = target;
  candidate.style_profile = "whiteboard_v1";
  if (!Array.isArray(candidate.scenes)) return candidate;
  candidate.scenes = candidate.scenes.map((scene) => {
    if (!scene || typeof scene !== "object" || Array.isArray(scene)) return scene;
    const normalized = {...(scene as Record<string, unknown>)};
    let replaced = false;
    if (Array.isArray(normalized.characters)) {
      normalized.characters = normalized.characters.map((id) => {
        if (typeof id === "string" && characters.has(id)) return id;
        replaced = true;
        return placeholder;
      });
    }
    if (Array.isArray(normalized.props)) {
      normalized.props = normalized.props.map((id) => {
        if (typeof id === "string" && props.has(id)) return id;
        replaced = true;
        return placeholder;
      });
    }
    if (typeof normalized.background !== "string" || !backgrounds.has(normalized.background)) {
      normalized.background = placeholder;
      replaced = true;
    }
    if (replaced) normalized.review_status = "needs_review";
    return normalized;
  });
  return candidate;
};

const durationForTarget = (target: TargetValue, settings?: ProjectSettingsValue) =>
  settings?.duration_seconds ?? (target === "yt_long" ? 420 : target === "reel" ? 75 : 55);

const referenceSource = (title: string, author: string | null) =>
  `Reference-only project for ${title}${author ? ` by ${author}` : ""}. No manuscript was supplied. ` +
  "Treat every claim as unverified until the editor fact-checks it against public sources.";

const updateStatus = (id: string, status: ProjectStatus): ProjectManifest => {
  const manifest = readProjectManifest(id);
  const updated = {...manifest, status};
  writeProjectManifest(id, updated);
  getDb().prepare("UPDATE project SET status = ? WHERE id = ?").run(status, id);
  return updated;
};

const recordFromManifest = (manifest: ProjectManifest): ProjectRecord => {
  const paths = getProjectPaths(manifest.id);
  return {...manifest, dir: paths.root};
};

const sourceFile = (id: string) => path.join(getProjectPaths(id).source, "source.md");

const readSourceSections = (id: string) => {
  const paths = getProjectPaths(id);
  if (!existsSync(paths.sourceSections)) return segmentSource(readFileSync(sourceFile(id), "utf8"));
  return z.array(z.object({
    id: z.string(),
    heading: z.string(),
    start_offset: z.number(),
    end_offset: z.number(),
    excerpt: z.string(),
  })).parse(readJsonFile(paths.sourceSections));
};

const writeRevision = (id: string, kind: "brief" | "script" | "storyboard", value: unknown) => {
  const paths = ensureProjectDirectories(id);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  writeJsonFile(path.join(paths.revisions, `${kind}-${stamp}.json`), value);
};

const annotateScript = (script: ScriptValue, sections: ReturnType<typeof readSourceSections>, mode: InputMode): ScriptValue =>
  ScriptSchema.parse({
    sections: script.sections.map((section, index) => ({
      ...section,
      claim_kind: mode === "reference_only" ? "interpretation" : section.claim_kind,
      source_refs: (() => {
        const known = new Set(sections.map((source) => source.id));
        const valid = section.source_refs.filter((reference) => known.has(reference));
        return valid.length ? valid : mode === "text" ? sourceRefsForIndex(sections, index) : [];
      })(),
      review_status: "needs_review",
    })),
  });

const annotateStoryboard = (storyboard: StoryboardValue, sections: ReturnType<typeof readSourceSections>, mode: InputMode): StoryboardValue =>
  Storyboard.parse({
    ...storyboard,
    scenes: storyboard.scenes.map((scene, index) => ({
      ...scene,
      claim_kind: mode === "reference_only" ? "interpretation" : scene.claim_kind,
      source_refs: (() => {
        const known = new Set(sections.map((source) => source.id));
        const valid = scene.source_refs.filter((reference) => known.has(reference));
        return valid.length ? valid : mode === "text" ? sourceRefsForIndex(sections, index) : [];
      })(),
      alt_description: scene.alt_description || `${scene.action} on ${scene.background}`,
      review_status: scene.review_status === "ok" ? "needs_review" : scene.review_status,
    })),
  });

const retryJson = async <T>(
  label: string,
  producer: (repair: boolean) => Promise<string>,
  schema: z.ZodType<T>,
  transform: (value: unknown) => unknown = (value) => value,
): Promise<T> => {
  let lastError: unknown;
  for (const repair of [false, true]) {
    try {
      const value = transform(parseJson(await producer(repair), label));
      return schema.parse(value);
    } catch (error) {
      lastError = error;
      if (!repair) continue;
    }
  }
  const detail = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`${label} failed validation after one repair attempt: ${detail}`);
};

export const createProject = (input: CreateProjectInput): ProjectRecord => {
  const title = input.title?.trim();
  if (!title) throw new Error("A project title is required.");
  if (title.length > MAX_TITLE_CHARACTERS) throw new Error(`Project titles must be ${MAX_TITLE_CHARACTERS} characters or fewer.`);
  const target = Target.parse(input.target);
  const mode: InputMode = input.inputMode ?? (input.sourceText?.trim() ? "text" : "reference_only");
  const author = input.author?.trim() || null;
  const sourceText = input.sourceText?.trim() || (mode === "reference_only" ? referenceSource(title, author) : "");
  if (author && author.length > MAX_AUTHOR_CHARACTERS) throw new Error(`Author names must be ${MAX_AUTHOR_CHARACTERS} characters or fewer.`);
  if (mode === "text" && !sourceText) throw new Error("Paste source notes or choose reference-only mode.");
  if (sourceText.length > MAX_SOURCE_CHARACTERS) {
    throw new Error(`Source notes must be ${MAX_SOURCE_CHARACTERS.toLocaleString()} characters or fewer for this local v1 generator.`);
  }

  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const {paths, manifest} = createProjectFiles({
    id,
    title,
    author,
    inputMode: mode,
    target,
    sourceText,
    rightsStatus: input.rightsStatus,
    settings: input.settings,
    createdAt,
  });
  const sections = segmentSource(sourceText);
  writeJsonFile(paths.sourceMetadata, {
    imported_at: createdAt,
    character_count: sourceText.length,
    input_mode: mode,
    rights_status: manifest.rights_status,
  });
  writeJsonFile(paths.sourceSections, sections);
  writeJsonFile(paths.claims, []);
  getDb()
    .prepare(
      "INSERT INTO project (id, title, author, input_mode, target, status, dir, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .run(id, title, author, mode, target, "created", paths.root, createdAt);
  return recordFromManifest(manifest);
};

export const listProjects = (): ProjectRecord[] =>
  getDb()
    .prepare("SELECT id FROM project ORDER BY created_at DESC")
    .all()
    .flatMap((row) => {
      const id = (row as {id?: unknown}).id;
      if (typeof id !== "string") return [];
      try {
        return [recordFromManifest(readProjectManifest(id))];
      } catch {
        return [];
      }
    });

export const getProject = (id: string): ProjectRecord => {
  const row = getDb()
    .prepare("SELECT id FROM project WHERE id = ?")
    .get(id) as {id: string} | undefined;
  if (!row) throw new Error("Project not found.");
  return recordFromManifest(readProjectManifest(id));
};

export const updateProject = (id: string, input: UpdateProjectInput): ProjectRecord => {
  const current = readProjectManifest(id);
  const title = input.title === undefined ? current.title : input.title.trim();
  if (!title) throw new Error("A project title is required.");
  if (title.length > MAX_TITLE_CHARACTERS) throw new Error(`Project titles must be ${MAX_TITLE_CHARACTERS} characters or fewer.`);
  const author = input.author === undefined ? current.author : input.author?.trim() || null;
  if (author && author.length > MAX_AUTHOR_CHARACTERS) throw new Error(`Author names must be ${MAX_AUTHOR_CHARACTERS} characters or fewer.`);
  const inputMode = input.inputMode ?? current.input_mode;
  const target = Target.parse(input.target ?? current.target);
  const rightsStatus = RightsStatus.parse(input.rightsStatus ?? current.rights_status);
  const settings = ProjectSettings.parse({...current.settings, ...(input.settings ?? {})});
  let source = input.sourceText === undefined ? readFileSync(sourceFile(id), "utf8") : input.sourceText.trim();
  if (inputMode === "reference_only") source = referenceSource(title, author);
  if (inputMode === "text" && !source.trim()) throw new Error("Paste source notes or choose reference-only mode.");
  if (source.length > MAX_SOURCE_CHARACTERS) throw new Error(`Source notes must be ${MAX_SOURCE_CHARACTERS.toLocaleString()} characters or fewer.`);

  const sourceChanged = source !== readFileSync(sourceFile(id), "utf8");
  const rightsChanged = rightsStatus !== current.rights_status;
  const changed = sourceChanged || rightsChanged || title !== current.title || author !== current.author || target !== current.target || inputMode !== current.input_mode || JSON.stringify(settings) !== JSON.stringify(current.settings);
  const manifest: ProjectManifest = {
    ...current,
    title,
    author,
    input_mode: inputMode,
    target,
    rights_status: rightsStatus,
    settings,
    status: changed ? "created" : current.status,
    approvals: changed
      ? {...current.approvals, script_reviewed_at: null, storyboard_reviewed_at: null, ...(sourceChanged || rightsChanged ? {source_reviewed_at: null} : {})}
      : current.approvals,
  };
  if (sourceChanged) {
    writeFileSync(sourceFile(id), source, "utf8");
    const sections = segmentSource(source);
    const paths = getProjectPaths(id);
    writeJsonFile(paths.sourceSections, sections);
    writeJsonFile(paths.sourceMetadata, {
      imported_at: new Date().toISOString(),
      character_count: source.length,
      input_mode: inputMode,
      rights_status: rightsStatus,
    });
  }
  writeProjectManifest(id, manifest);
  getDb().prepare("UPDATE project SET title = ?, author = ?, input_mode = ?, target = ?, status = ? WHERE id = ?")
    .run(title, author, inputMode, target, manifest.status, id);
  return recordFromManifest(readProjectManifest(id));
};

export const approveProject = (id: string, gate: "source" | "script" | "storyboard"): ProjectRecord => {
  const current = readProjectManifest(id);
  const field = `${gate}_reviewed_at` as keyof ProjectManifest["approvals"];
  const paths = getProjectPaths(id);
  if (gate === "script" && existsSync(paths.script)) {
    const script = ScriptSchema.parse(readJsonFile(paths.script));
    writeRevision(id, "script", script);
    writeJsonFile(paths.script, {...script, sections: script.sections.map((section) => ({...section, review_status: "ok" as const}))});
  }
  if (gate === "storyboard" && existsSync(paths.storyboardJson)) {
    const storyboard = Storyboard.parse(readJsonFile(paths.storyboardJson));
    writeRevision(id, "storyboard", storyboard);
    writeJsonFile(paths.storyboardJson, {...storyboard, scenes: storyboard.scenes.map((scene) => ({...scene, review_status: "ok" as const}))});
  }
  const manifest: ProjectManifest = {
    ...current,
    approvals: {...current.approvals, [field]: new Date().toISOString()},
  };
  writeProjectManifest(id, manifest);
  return recordFromManifest(readProjectManifest(id));
};

export const saveBrief = (id: string, value: unknown): Brief => {
  const brief = EditorialBrief.parse(value);
  const paths = ensureProjectDirectories(id);
  if (existsSync(paths.brief)) writeRevision(id, "brief", readJsonFile(paths.brief));
  writeJsonFile(paths.brief, brief);
  updateStatus(id, "scripted");
  return brief;
};

export const saveScript = (id: string, value: unknown): ScriptValue => {
  const manifest = readProjectManifest(id);
  const script = annotateScript(ScriptSchema.parse(value), readSourceSections(id), manifest.input_mode);
  const paths = ensureProjectDirectories(id);
  if (existsSync(paths.script)) writeRevision(id, "script", readJsonFile(paths.script));
  writeJsonFile(paths.script, script);
  writeProjectManifest(id, {...manifest, status: "scripted", approvals: {...manifest.approvals, script_reviewed_at: null, storyboard_reviewed_at: null}});
  getDb().prepare("UPDATE project SET status = ? WHERE id = ?").run("scripted", id);
  return script;
};

export const saveStoryboard = (id: string, value: unknown): StoryboardValue => {
  const manifest = readProjectManifest(id);
  const storyboard = annotateStoryboard(Storyboard.parse(value), readSourceSections(id), manifest.input_mode);
  if (storyboard.target !== manifest.target) throw new Error("The storyboard target must match the project target.");
  const paths = ensureProjectDirectories(id);
  if (existsSync(paths.storyboardJson)) writeRevision(id, "storyboard", readJsonFile(paths.storyboardJson));
  writeJsonFile(paths.storyboardJson, storyboard);
  writeProjectManifest(id, {...manifest, status: "storyboarded", approvals: {...manifest.approvals, storyboard_reviewed_at: null}});
  getDb().prepare("UPDATE project SET status = ? WHERE id = ?").run("storyboarded", id);
  return storyboard;
};

export const runProjectQa = (id: string) => {
  const paths = getProjectPaths(id);
  const report = runQa({
    manifest: readProjectManifest(id),
    sourceSections: readSourceSections(id),
    script: existsSync(paths.script) ? ScriptSchema.parse(readJsonFile(paths.script)) : null,
    storyboard: existsSync(paths.storyboardJson) ? Storyboard.parse(readJsonFile(paths.storyboardJson)) : null,
  });
  writeJsonFile(paths.qaReport, report);
  return report;
};

const generateProjectUnlocked = async (id: string) => {
  const project = getProject(id);
  const paths = getProjectPaths(id);
  const sourcePath = path.join(paths.source, "source.md");
  const source = readFileSync(sourcePath, "utf8").trim();
  if (!source) throw new Error("This project has no source text to generate from.");
  const llm = createLLM();
  const common = {
    TARGET: project.target,
    INPUT_MODE: project.input_mode,
    SOURCE: source,
    DURATION: String(durationForTarget(project.target, project.settings)),
  };

  const briefTemplate = prompt("brief", common);
  const brief = await retryJson(
    "Editorial brief",
    (repair) =>
      llm.generate(
        "You are an editorial lead. Follow the supplied contract exactly.",
        `${briefTemplate}${repair ? "\n\nYour previous response was invalid. Return only valid contract JSON." : ""}`,
        true,
      ),
    EditorialBrief,
  );

  const scriptTemplate = prompt("script", {...common, BRIEF: pretty(brief)});
  const generatedScript = await retryJson(
    "Script",
    (repair) =>
      llm.generate(
        "You write original teaching scripts. Follow the supplied contract exactly.",
        `${scriptTemplate}${repair ? "\n\nYour previous response was invalid. Return only valid contract JSON." : ""}`,
        true,
      ),
    ScriptSchema,
  );
  const script = annotateScript(generatedScript, readSourceSections(id), project.input_mode);

  const storyboardTemplate = prompt("storyboard", {
    TARGET: project.target,
    ASSET_IDS: assetIds().join(", "),
    SCRIPT: pretty(script),
  });
  const generatedStoryboard = await retryJson(
    "Storyboard",
    (repair) =>
      llm.generate(
        "You are a storyboard artist. Use only the approved assets and return the supplied JSON contract.",
        `${storyboardTemplate}${repair ? "\n\nYour previous response was invalid. Correct it and return only valid JSON." : ""}`,
        true,
      ),
    Storyboard,
    (value) => ensureAssetVocabulary(value, project.target),
  );

  const storyboard = annotateStoryboard(generatedStoryboard, readSourceSections(id), project.input_mode);

  // The two v1 style checks are deliberately small: the schema limits text
  // and provides one accent field per scene. Keep the explicit guard here so
  // additions to the generator contract cannot silently bypass it.
  for (const scene of storyboard.scenes) {
    if ((scene.on_screen_text ?? "").length > 60) {
      throw new Error(`Scene ${scene.scene_id} exceeds the 60-character on-screen-text limit.`);
    }
  }

  if (existsSync(paths.brief)) writeRevision(id, "brief", readJsonFile(paths.brief));
  if (existsSync(paths.script)) writeRevision(id, "script", readJsonFile(paths.script));
  if (existsSync(paths.storyboardJson)) writeRevision(id, "storyboard", readJsonFile(paths.storyboardJson));
  writeJsonFile(paths.brief, brief);
  writeJsonFile(paths.script, script);
  writeJsonFile(paths.storyboardJson, storyboard);
  const manifest = readProjectManifest(id);
  writeProjectManifest(id, {...manifest, status: "storyboarded", approvals: {...manifest.approvals, script_reviewed_at: null, storyboard_reviewed_at: null}});
  getDb().prepare("UPDATE project SET status = ? WHERE id = ?").run("storyboarded", id);
  return {brief, script, storyboard};
};

const narrateProjectUnlocked = async (id: string) => {
  const paths = getProjectPaths(id);
  const qa = runProjectQa(id);
  if (!qa.can_render) throw new Error("Resolve the blocking review issues before narration. Open QA for the exact checks.");
  const storyboard = Storyboard.parse(readJsonFile(paths.storyboardJson));
  const tts = createTTS();
  mkdirSync(paths.audio, {recursive: true});
  const audio: string[] = [];
  const scenes = [] as StoryboardValue["scenes"];
  const narrationRequests = storyboard.scenes.map((scene) => ({
    text: scene.narration,
    outPath: path.join(paths.audio, `scene_${scene.scene_id}.mp3`),
  }));
  const results: Array<{ seconds: number }> = [];

  if (tts.synthesizeBatch) {
    results.push(...(await tts.synthesizeBatch(narrationRequests)));
  } else {
    for (const request of narrationRequests) results.push(await tts.synthesize(request.text, request.outPath));
  }
  if (results.length !== storyboard.scenes.length) {
    throw new Error("The narration provider returned an incomplete set of scene durations.");
  }

  for (let index = 0; index < storyboard.scenes.length; index += 1) {
    const scene = storyboard.scenes[index];
    const outPath = narrationRequests[index].outPath;
    const result = results[index];
    if (!Number.isFinite(result.seconds) || result.seconds <= 0) {
      throw new Error(`Narration for scene ${scene.scene_id} did not produce a usable duration.`);
    }
    const visualDuration = result.seconds + 0.3;
    if (visualDuration > 12) {
      throw new Error(`Scene ${scene.scene_id} is ${visualDuration.toFixed(1)} seconds after narration. Split it into shorter storyboard scenes.`);
    }
    scenes.push({...scene, duration_seconds: Math.max(1, visualDuration)});
    audio.push(outPath);
  }

  const audioFirstStoryboard = Storyboard.parse({...storyboard, scenes});
  writeJsonFile(paths.storyboardJson, audioFirstStoryboard);
  const manifest = readProjectManifest(id);
  writeProjectManifest(id, {...manifest, status: "narrated", approvals: {...manifest.approvals, storyboard_reviewed_at: null}});
  getDb().prepare("UPDATE project SET status = ? WHERE id = ?").run("narrated", id);
  return {storyboard: audioFirstStoryboard, audio};
};

const renderProjectUnlocked = async (id: string) => {
  const paths = getProjectPaths(id);
  const qa = runProjectQa(id);
  if (!qa.can_render) throw new Error("Resolve the blocking QA issues before rendering. Open QA for the exact checks.");
  const storyboard = Storyboard.parse(readJsonFile(paths.storyboardJson));
  const audio = storyboard.scenes.map((scene) => path.join(paths.audio, `scene_${scene.scene_id}.mp3`));
  const missing = audio.find((filePath) => !existsSync(filePath));
  if (missing) throw new Error("Narration must complete before rendering. One or more scene MP3s are missing.");
  const outputs = await renderStoryboard({projectDir: paths.root, storyboard, audioPaths: audio});
  const srt = readFileSync(paths.captions, "utf8").trim();
  writeFileSync(paths.captionsVtt, `WEBVTT\n\n${srt.replace(/,/g, ".")}\n`, "utf8");
  updateStatus(id, "rendered");
  return outputs;
};

const packMarkdown = (pack: PackValue) => {
  const titles = pack.titles.map((title, index) => `${index + 1}. ${title.text} (${title.angle}, ${title.score.toFixed(2)})`).join("\n");
  const chapters = pack.chapters.length ? pack.chapters.map((chapter) => `- ${chapter.timestamp} ${chapter.title}`).join("\n") : "- Add reviewed chapters after final edit.";
  const candidates = pack.short_candidates.length ? pack.short_candidates.map((candidate) => `- ${candidate.label}: scenes ${candidate.scene_ids.join(", ")} — ${candidate.rationale}`).join("\n") : "- No short candidates selected yet.";
  return `# Publishing pack\n\n## Ranked titles\n${titles}\n\n## Description\n${pack.description}\n\n## Tags\n${pack.tags.join(", ")}\n\n## Thumbnail copy\n${pack.thumbnail_copy}\n\n## Chapters\n${chapters}\n\n## Pinned comment\n${pack.pinned_comment || "Add a reviewed pinned comment."}\n\n## Short-form candidates\n${candidates}\n`;
};

const timestamp = (seconds: number) => {
  const rounded = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(rounded / 60);
  const remainder = String(rounded % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
};

const enrichPack = (pack: PackValue, storyboard: StoryboardValue | null): PackValue => {
  if (!storyboard) return pack;
  let elapsed = 0;
  const chapters = storyboard.scenes.reduce<PackValue["chapters"]>((entries, scene) => {
    const start = elapsed;
    elapsed += scene.duration_seconds;
    if (entries.length < 12 && ["hook", "explain", "demonstrate", "recap"].includes(scene.purpose)) {
      entries.push({timestamp: timestamp(start), title: scene.on_screen_text || scene.narration.split(/[.!?]/)[0].slice(0, 80)});
    }
    return entries;
  }, []);
  const candidates = storyboard.scenes
    .filter((scene) => scene.purpose === "hook" || scene.purpose === "demonstrate" || scene.purpose === "recap")
    .slice(0, 8)
    .map((scene) => ({
      label: scene.on_screen_text || `Scene ${scene.scene_id}`,
      scene_ids: [scene.scene_id],
      rationale: `${scene.purpose} with a self-contained teaching beat.`,
    }));
  return Pack.parse({
    ...pack,
    chapters: pack.chapters.length ? pack.chapters : chapters,
    pinned_comment: pack.pinned_comment || "What is one small change you can make today?",
    short_candidates: pack.short_candidates.length ? pack.short_candidates : candidates,
  });
};

const escapeXml = (value: string) => value.replace(/[&<>"']/g, (character) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;"})[character] ?? character);

const writeThumbnail = (outPath: string, project: ProjectRecord, pack: PackValue) => {
  const text = escapeXml((pack.thumbnail_copy || project.title).slice(0, 40));
  const title = escapeXml(project.title.slice(0, 80));
  writeFileSync(outPath, `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><rect width="1280" height="720" fill="#FAFAF7"/><path d="M145 520 L270 325 L395 520 M270 325 L270 130" fill="none" stroke="#171717" stroke-width="18" stroke-linecap="round"/><circle cx="270" cy="105" r="48" fill="none" stroke="#171717" stroke-width="18"/><path d="M555 220 H1130 M555 265 H1005" stroke="#2F80ED" stroke-width="18" stroke-linecap="round"/><text x="555" y="390" fill="#171717" font-family="Arial, sans-serif" font-size="82" font-weight="800">${text}</text><text x="555" y="475" fill="#4A4A4A" font-family="Arial, sans-serif" font-size="32">${title}</text><rect x="555" y="535" width="190" height="18" rx="9" fill="#F2C94C"/></svg>`, "utf8");
};

const packageProjectUnlocked = async (id: string) => {
  const project = getProject(id);
  const paths = getProjectPaths(id);
  const script = ScriptSchema.parse(readJsonFile(paths.script));
  const llm = createLLM();
  const template = prompt("pack", {TARGET: project.target, SCRIPT: pretty(script)});
  const generatedPack = await retryJson(
    "Publishing pack",
    (repair) =>
      llm.generate(
        "You are a growth editor. Follow the supplied contract exactly.",
        `${template}${repair ? "\n\nYour previous response was invalid. Return only valid contract JSON." : ""}`,
        true,
      ),
    Pack,
  );
  const storyboard = existsSync(paths.storyboardJson) ? Storyboard.parse(readJsonFile(paths.storyboardJson)) : null;
  const pack = enrichPack(generatedPack, storyboard);
  writeJsonFile(paths.packJson, pack);
  writeFileSync(paths.packMarkdown, packMarkdown(pack), "utf8");
  writeFileSync(paths.shortsMarkdown, pack.short_candidates.map((candidate) => `# ${candidate.label}\n\nScenes: ${candidate.scene_ids.join(", ")}\n\n${candidate.rationale}\n`).join("\n"), "utf8");
  writeThumbnail(paths.thumbnailSvg, project, pack);
  updateStatus(id, "packaged");
  return pack;
};

export const projectArtifacts = (id: string) => {
  const paths = getProjectPaths(id);
  const present = (filePath: string) => existsSync(filePath);
  const manifest = readProjectManifest(id);
  const qa = present(paths.qaReport) ? QaReport.parse(readJsonFile(paths.qaReport)) : runQa({
    manifest,
    sourceSections: readSourceSections(id),
    script: present(paths.script) ? ScriptSchema.parse(readJsonFile(paths.script)) : null,
    storyboard: present(paths.storyboardJson) ? Storyboard.parse(readJsonFile(paths.storyboardJson)) : null,
  });
  return {
    project: recordFromManifest(manifest),
    source: {
      text: existsSync(sourceFile(id)) ? readFileSync(sourceFile(id), "utf8") : "",
      sections: readSourceSections(id),
    },
    brief: present(paths.brief) ? EditorialBrief.parse(readJsonFile(paths.brief)) : null,
    script: present(paths.script) ? ScriptSchema.parse(readJsonFile(paths.script)) : null,
    storyboard: present(paths.storyboardJson) ? Storyboard.parse(readJsonFile(paths.storyboardJson)) : null,
    pack: present(paths.packJson) ? Pack.parse(readJsonFile(paths.packJson)) : null,
    qa,
    files: {
      video16x9: present(paths.export16x9),
      video9x16: present(paths.export9x16),
      captions: present(paths.captions),
      captionsVtt: present(paths.captionsVtt),
      thumbnail: present(paths.thumbnailSvg),
      publishingPack: present(paths.packMarkdown),
      shortCandidates: present(paths.shortsMarkdown),
      audio: existsSync(paths.audio) ? readdirSync(paths.audio).filter((name) => /^scene_\d+\.mp3$/.test(name)) : [],
    },
  };
};

export const generateProject = (id: string) => withProjectLock(id, "Generation", () => generateProjectUnlocked(id));
export const narrateProject = (id: string) => withProjectLock(id, "Narration", () => narrateProjectUnlocked(id));
export const renderProject = (id: string) => withProjectLock(id, "Rendering", () => renderProjectUnlocked(id));
export const packageProject = (id: string) => withProjectLock(id, "Publishing-pack generation", () => packageProjectUnlocked(id));
