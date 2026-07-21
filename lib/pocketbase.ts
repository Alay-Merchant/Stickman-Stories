import {existsSync, readFileSync} from "node:fs";
import path from "node:path";

import {getProjectPaths, readJsonFile, readProjectManifest} from "./project";

type PocketBaseList<T> = {items?: T[]};
type PocketBaseProject = {id: string; local_id?: string};

const config = () => ({
  baseUrl: process.env.POCKETBASE_URL?.replace(/\/$/, "") ?? "",
  token: process.env.POCKETBASE_SUPERUSER_TOKEN?.trim() ?? "",
  ownerId: process.env.POCKETBASE_OWNER_ID?.trim() ?? "",
  collection: process.env.POCKETBASE_PROJECT_COLLECTION?.trim() || "studio_projects",
});

export const pocketBaseEnabled = () => {
  const value = config();
  return Boolean(value.baseUrl && value.token && value.ownerId);
};

const request = async <T>(endpoint: string, init?: RequestInit): Promise<T> => {
  const value = config();
  if (!value.baseUrl || !value.token || !value.ownerId) {
    throw new Error("PocketBase sync requires POCKETBASE_URL, POCKETBASE_SUPERUSER_TOKEN, and POCKETBASE_OWNER_ID.");
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`${value.baseUrl}${endpoint}`, {
      ...init,
      headers: {
        Authorization: value.token,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`PocketBase sync failed with HTTP ${response.status}.`);
    return await response.json() as T;
  } finally {
    clearTimeout(timeout);
  }
};

/**
 * Mirrors structured private project data to PocketBase. It deliberately does
 * not put multi-minute MP4s through a serverless request; use PocketBase's
 * protected File fields with S3 storage from the render worker for that.
 */
export const syncProjectToPocketBase = async (id: string) => {
  if (!pocketBaseEnabled()) return {enabled: false};
  const value = config();
  const paths = getProjectPaths(id);
  const optionalJson = (filePath: string) => existsSync(filePath) ? readJsonFile(filePath) : null;
  const sourcePath = path.join(paths.source, "source.md");
  const manifest = readProjectManifest(id);
  const snapshot = {
    manifest,
    source_sections: optionalJson(paths.sourceSections),
    brief: optionalJson(paths.brief),
    script: optionalJson(paths.script),
    storyboard: optionalJson(paths.storyboardJson),
    qa: optionalJson(paths.qaReport),
    pack: optionalJson(paths.packJson),
    available_exports: {
      video16x9: existsSync(paths.export16x9),
      video9x16: existsSync(paths.export9x16),
      captions: existsSync(paths.captions),
      thumbnail: existsSync(paths.thumbnailSvg),
    },
  };
  const filter = encodeURIComponent(`local_id = "${id.replace(/"/g, "\\\"")}"`);
  const existing = await request<PocketBaseList<PocketBaseProject>>(`/api/collections/${encodeURIComponent(value.collection)}/records?perPage=1&filter=${filter}`);
  const body = {
    owner: value.ownerId,
    local_id: id,
    title: manifest.title,
    status: manifest.status,
    target: manifest.target,
    rights_status: manifest.rights_status,
    snapshot,
    source_text: existsSync(sourcePath) ? readFileSync(sourcePath, "utf8") : "",
  };
  const record = existing.items?.[0];
  if (record?.id) {
    await request(`/api/collections/${encodeURIComponent(value.collection)}/records/${encodeURIComponent(record.id)}`, {method: "PATCH", body: JSON.stringify(body)});
  } else {
    await request(`/api/collections/${encodeURIComponent(value.collection)}/records`, {method: "POST", body: JSON.stringify(body)});
  }
  return {enabled: true};
};
