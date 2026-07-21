import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import {ProjectSettings, RightsStatus, type Target, type ProjectSettings as ProjectSettingsValue, type RightsStatus as RightsStatusValue} from "./schema";
import { getDataDirectory } from "./db";

export const INPUT_MODES = ["text", "reference_only"] as const;
export type InputMode = (typeof INPUT_MODES)[number];

export const PROJECT_STATUSES = [
  "created",
  "scripted",
  "storyboarded",
  "narrated",
  "rendered",
  "packaged",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export interface ProjectRecord extends ProjectManifest {
  dir: string;
}

export interface ProjectManifest {
  id: string;
  title: string;
  author: string | null;
  input_mode: InputMode;
  target: Target;
  status: ProjectStatus;
  rights_status: RightsStatusValue;
  settings: ProjectSettingsValue;
  approvals: ProjectApprovals;
  created_at: string;
  updated_at: string;
}

export interface ProjectApprovals {
  source_reviewed_at: string | null;
  script_reviewed_at: string | null;
  storyboard_reviewed_at: string | null;
}

export interface ProjectPaths {
  root: string;
  manifest: string;
  source: string;
  sourceMetadata: string;
  sourceSections: string;
  claims: string;
  editorial: string;
  brief: string;
  script: string;
  revisions: string;
  storyboard: string;
  storyboardJson: string;
  review: string;
  qaReport: string;
  audio: string;
  renders: string;
  masterRender: string;
  exports: string;
  export16x9: string;
  export9x16: string;
  captions: string;
  captionsVtt: string;
  packJson: string;
  packMarkdown: string;
  thumbnailSvg: string;
  shortsMarkdown: string;
}

export interface CreateProjectFilesInput {
  id: string;
  title: string;
  author?: string | null;
  inputMode: InputMode;
  target: Target;
  sourceText?: string;
  rightsStatus?: RightsStatusValue;
  settings?: Partial<ProjectSettingsValue>;
  createdAt?: string;
}

const PROJECT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;

export function getProjectsDirectory(): string {
  return join(getDataDirectory(), "projects");
}

export function assertProjectId(id: string): string {
  if (!PROJECT_ID_PATTERN.test(id)) {
    throw new Error("Project id must contain only letters, numbers, underscores, or hyphens.");
  }

  return id;
}

export function getProjectPaths(id: string): ProjectPaths {
  const projectId = assertProjectId(id);
  const projectsRoot = resolve(getProjectsDirectory());
  const root = resolve(projectsRoot, projectId);

  if (relative(projectsRoot, root).startsWith("..")) {
    throw new Error("Project directory must stay within the projects directory.");
  }

  const source = join(root, "source");
  const knowledge = join(root, "knowledge");
  const editorial = join(root, "editorial");
  const revisions = join(editorial, "revisions");
  const storyboard = join(root, "storyboard");
  const review = join(root, "review");
  const audio = join(root, "audio");
  const renders = join(root, "renders");
  const exports = join(root, "exports");

  return {
    root,
    manifest: join(root, "manifest.json"),
    source,
    sourceMetadata: join(source, "metadata.json"),
    sourceSections: join(knowledge, "sections.json"),
    claims: join(knowledge, "claims.json"),
    editorial,
    brief: join(editorial, "brief.json"),
    script: join(editorial, "script.json"),
    revisions,
    storyboard,
    storyboardJson: join(storyboard, "storyboard.json"),
    review,
    qaReport: join(review, "qa.json"),
    audio,
    renders,
    masterRender: join(renders, "master.mp4"),
    exports,
    export16x9: join(exports, "16x9.mp4"),
    export9x16: join(exports, "9x16.mp4"),
    captions: join(exports, "captions.srt"),
    captionsVtt: join(exports, "captions.vtt"),
    packJson: join(exports, "pack.json"),
    packMarkdown: join(exports, "pack.md"),
    thumbnailSvg: join(exports, "thumbnail.svg"),
    shortsMarkdown: join(exports, "short-candidates.md"),
  };
}

export function ensureProjectDirectories(id: string): ProjectPaths {
  const paths = getProjectPaths(id);
  for (const directory of [
    paths.root,
    paths.source,
    join(paths.root, "knowledge"),
    paths.editorial,
    paths.revisions,
    paths.storyboard,
    paths.review,
    paths.audio,
    paths.renders,
    paths.exports,
  ]) {
    mkdirSync(directory, { recursive: true });
  }

  return paths;
}

export function writeJsonFile<T>(filePath: string, value: T): void {
  const temporaryPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(temporaryPath, filePath);
}

export function readJsonFile<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

export function createProjectFiles(input: CreateProjectFilesInput): {
  paths: ProjectPaths;
  manifest: ProjectManifest;
} {
  const paths = ensureProjectDirectories(input.id);
  const timestamp = input.createdAt ?? new Date().toISOString();
  const manifest: ProjectManifest = {
    id: input.id,
    title: input.title,
    author: input.author ?? null,
    input_mode: input.inputMode,
    target: input.target,
    status: "created",
    rights_status: RightsStatus.parse(input.rightsStatus ?? "commentary_review_required"),
    settings: ProjectSettings.parse(input.settings ?? {}),
    approvals: {
      source_reviewed_at: null,
      script_reviewed_at: null,
      storyboard_reviewed_at: null,
    },
    created_at: timestamp,
    updated_at: timestamp,
  };

  writeJsonFile(paths.manifest, manifest);
  writeFileSync(join(paths.source, "source.md"), input.sourceText ?? "", "utf8");

  return { paths, manifest };
}

export function readProjectManifest(id: string): ProjectManifest {
  const raw = readJsonFile<Partial<ProjectManifest>>(getProjectPaths(id).manifest);
  const timestamp = raw.created_at ?? new Date().toISOString();
  return {
    id: String(raw.id ?? id),
    title: String(raw.title ?? "Untitled project"),
    author: raw.author ?? null,
    input_mode: raw.input_mode ?? "text",
    target: raw.target ?? "yt_short",
    status: raw.status ?? "created",
    rights_status: RightsStatus.parse(raw.rights_status ?? "commentary_review_required"),
    settings: ProjectSettings.parse(raw.settings ?? {}),
    approvals: {
      source_reviewed_at: raw.approvals?.source_reviewed_at ?? null,
      script_reviewed_at: raw.approvals?.script_reviewed_at ?? null,
      storyboard_reviewed_at: raw.approvals?.storyboard_reviewed_at ?? null,
    },
    created_at: timestamp,
    updated_at: raw.updated_at ?? timestamp,
  };
}

export function writeProjectManifest(id: string, manifest: ProjectManifest): void {
  const paths = ensureProjectDirectories(id);
  writeJsonFile(paths.manifest, {...manifest, updated_at: new Date().toISOString()});
}
