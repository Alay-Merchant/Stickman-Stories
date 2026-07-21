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
import {Pack, ScenePurpose, Storyboard, Target, type Pack as PackValue, type Storyboard as StoryboardValue, type Target as TargetValue} from "./schema";
import {createTTS} from "./tts";

const Brief = z.object({
  objective: z.string().min(1).max(500),
  audience: z.string().min(1).max(500),
  angle: z.string().min(1).max(500),
  tone: z.enum(["curious", "calm", "playful", "direct", "serious"]),
  key_ideas: z.array(z.string().min(1).max(500)).min(1).max(8),
  caveats: z.array(z.string().min(1).max(500)).max(12).default([]),
  cta: z.string().min(1).max(500),
});
export type Brief = z.infer<typeof Brief>;

const Script = z.object({
  sections: z.array(z.object({purpose: ScenePurpose, narration: z.string().min(1).max(1_000)})).min(1).max(120),
});
export type Script = z.infer<typeof Script>;

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

const durationForTarget = (target: TargetValue) => (target === "yt_long" ? 420 : target === "reel" ? 75 : 55);

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
    createdAt,
  });
  getDb()
    .prepare(
      "INSERT INTO project (id, title, author, input_mode, target, status, dir, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .run(id, title, author, mode, target, "created", paths.root, createdAt);
  return recordFromManifest(manifest);
};

export const listProjects = (): ProjectRecord[] =>
  getDb()
    .prepare("SELECT id, title, author, input_mode, target, status, dir, created_at FROM project ORDER BY created_at DESC")
    .all() as ProjectRecord[];

export const getProject = (id: string): ProjectRecord => {
  const row = getDb()
    .prepare("SELECT id, title, author, input_mode, target, status, dir, created_at FROM project WHERE id = ?")
    .get(id) as ProjectRecord | undefined;
  if (!row) throw new Error("Project not found.");
  return row;
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
    DURATION: String(durationForTarget(project.target)),
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
    Brief,
  );

  const scriptTemplate = prompt("script", {...common, BRIEF: pretty(brief)});
  const script = await retryJson(
    "Script",
    (repair) =>
      llm.generate(
        "You write original teaching scripts. Follow the supplied contract exactly.",
        `${scriptTemplate}${repair ? "\n\nYour previous response was invalid. Return only valid contract JSON." : ""}`,
        true,
      ),
    Script,
  );

  const storyboardTemplate = prompt("storyboard", {
    TARGET: project.target,
    ASSET_IDS: assetIds().join(", "),
    SCRIPT: pretty(script),
  });
  const storyboard = await retryJson(
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

  // The two v1 style checks are deliberately small: the schema limits text
  // and provides one accent field per scene. Keep the explicit guard here so
  // additions to the generator contract cannot silently bypass it.
  for (const scene of storyboard.scenes) {
    if ((scene.on_screen_text ?? "").length > 60) {
      throw new Error(`Scene ${scene.scene_id} exceeds the 60-character on-screen-text limit.`);
    }
  }

  writeJsonFile(paths.brief, brief);
  writeJsonFile(paths.script, script);
  writeJsonFile(paths.storyboardJson, storyboard);
  updateStatus(id, "storyboarded");
  return {brief, script, storyboard};
};

const narrateProjectUnlocked = async (id: string) => {
  const paths = getProjectPaths(id);
  const storyboard = Storyboard.parse(readJsonFile(paths.storyboardJson));
  const tts = createTTS();
  mkdirSync(paths.audio, {recursive: true});
  const audio: string[] = [];
  const scenes = [] as StoryboardValue["scenes"];

  for (const scene of storyboard.scenes) {
    const outPath = path.join(paths.audio, `scene_${scene.scene_id}.mp3`);
    const result = await tts.synthesize(scene.narration, outPath);
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
  updateStatus(id, "narrated");
  return {storyboard: audioFirstStoryboard, audio};
};

const renderProjectUnlocked = async (id: string) => {
  const paths = getProjectPaths(id);
  const storyboard = Storyboard.parse(readJsonFile(paths.storyboardJson));
  const audio = storyboard.scenes.map((scene) => path.join(paths.audio, `scene_${scene.scene_id}.mp3`));
  const missing = audio.find((filePath) => !existsSync(filePath));
  if (missing) throw new Error("Narration must complete before rendering. One or more scene MP3s are missing.");
  const outputs = await renderStoryboard({projectDir: paths.root, storyboard, audioPaths: audio});
  updateStatus(id, "rendered");
  return outputs;
};

const packMarkdown = (pack: PackValue) => {
  const titles = pack.titles.map((title, index) => `${index + 1}. ${title.text} (${title.angle}, ${title.score.toFixed(2)})`).join("\n");
  return `# Publishing pack\n\n## Ranked titles\n${titles}\n\n## Description\n${pack.description}\n\n## Tags\n${pack.tags.join(", ")}\n\n## Thumbnail copy\n${pack.thumbnail_copy}\n`;
};

const packageProjectUnlocked = async (id: string) => {
  const project = getProject(id);
  const paths = getProjectPaths(id);
  const script = readJsonFile<Script>(paths.script);
  const llm = createLLM();
  const template = prompt("pack", {TARGET: project.target, SCRIPT: pretty(script)});
  const pack = await retryJson(
    "Publishing pack",
    (repair) =>
      llm.generate(
        "You are a growth editor. Follow the supplied contract exactly.",
        `${template}${repair ? "\n\nYour previous response was invalid. Return only valid contract JSON." : ""}`,
        true,
      ),
    Pack,
  );
  writeJsonFile(paths.packJson, pack);
  writeFileSync(paths.packMarkdown, packMarkdown(pack), "utf8");
  updateStatus(id, "packaged");
  return pack;
};

export const projectArtifacts = (id: string) => {
  const paths = getProjectPaths(id);
  const present = (filePath: string) => existsSync(filePath);
  return {
    project: getProject(id),
    brief: present(paths.brief) ? readJsonFile<Brief>(paths.brief) : null,
    script: present(paths.script) ? readJsonFile<Script>(paths.script) : null,
    storyboard: present(paths.storyboardJson) ? Storyboard.parse(readJsonFile(paths.storyboardJson)) : null,
    pack: present(paths.packJson) ? Pack.parse(readJsonFile(paths.packJson)) : null,
    files: {
      video16x9: present(paths.export16x9),
      video9x16: present(paths.export9x16),
      captions: present(paths.captions),
      audio: existsSync(paths.audio) ? readdirSync(paths.audio).filter((name) => /^scene_\d+\.mp3$/.test(name)) : [],
    },
  };
};

export const generateProject = (id: string) => withProjectLock(id, "Generation", () => generateProjectUnlocked(id));
export const narrateProject = (id: string) => withProjectLock(id, "Narration", () => narrateProjectUnlocked(id));
export const renderProject = (id: string) => withProjectLock(id, "Rendering", () => renderProjectUnlocked(id));
export const packageProject = (id: string) => withProjectLock(id, "Publishing-pack generation", () => packageProjectUnlocked(id));
