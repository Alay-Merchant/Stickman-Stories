import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import type { Target } from "./schema";
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

export interface ProjectRecord {
  id: string;
  title: string;
  author: string | null;
  input_mode: InputMode;
  target: Target;
  status: ProjectStatus;
  dir: string;
  created_at: string;
}

export interface ProjectManifest {
  id: string;
  title: string;
  author: string | null;
  input_mode: InputMode;
  target: Target;
  status: ProjectStatus;
  created_at: string;
}

export interface ProjectPaths {
  root: string;
  manifest: string;
  source: string;
  editorial: string;
  brief: string;
  script: string;
  storyboard: string;
  storyboardJson: string;
  audio: string;
  renders: string;
  masterRender: string;
  exports: string;
  export16x9: string;
  export9x16: string;
  captions: string;
  packJson: string;
  packMarkdown: string;
}

export interface CreateProjectFilesInput {
  id: string;
  title: string;
  author?: string | null;
  inputMode: InputMode;
  target: Target;
  sourceText?: string;
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
  const editorial = join(root, "editorial");
  const storyboard = join(root, "storyboard");
  const audio = join(root, "audio");
  const renders = join(root, "renders");
  const exports = join(root, "exports");

  return {
    root,
    manifest: join(root, "manifest.json"),
    source,
    editorial,
    brief: join(editorial, "brief.json"),
    script: join(editorial, "script.json"),
    storyboard,
    storyboardJson: join(storyboard, "storyboard.json"),
    audio,
    renders,
    masterRender: join(renders, "master.mp4"),
    exports,
    export16x9: join(exports, "16x9.mp4"),
    export9x16: join(exports, "9x16.mp4"),
    captions: join(exports, "captions.srt"),
    packJson: join(exports, "pack.json"),
    packMarkdown: join(exports, "pack.md"),
  };
}

export function ensureProjectDirectories(id: string): ProjectPaths {
  const paths = getProjectPaths(id);
  for (const directory of [
    paths.root,
    paths.source,
    paths.editorial,
    paths.storyboard,
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
  const manifest: ProjectManifest = {
    id: input.id,
    title: input.title,
    author: input.author ?? null,
    input_mode: input.inputMode,
    target: input.target,
    status: "created",
    created_at: input.createdAt ?? new Date().toISOString(),
  };

  writeJsonFile(paths.manifest, manifest);
  writeFileSync(join(paths.source, "source.md"), input.sourceText ?? "", "utf8");

  return { paths, manifest };
}

export function readProjectManifest(id: string): ProjectManifest {
  return readJsonFile<ProjectManifest>(getProjectPaths(id).manifest);
}

export function writeProjectManifest(id: string, manifest: ProjectManifest): void {
  const paths = ensureProjectDirectories(id);
  writeJsonFile(paths.manifest, manifest);
}
