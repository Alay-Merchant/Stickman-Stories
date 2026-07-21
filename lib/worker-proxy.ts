import {timingSafeEqual} from "node:crypto";

/**
 * Lets a Vercel/Netlify editor talk to the persistent Next.js render worker
 * without exposing the worker URL or its credentials to the browser. The
 * worker leaves RENDER_WORKER_URL unset, so it always handles requests
 * locally.
 */
const workerUrl = () => process.env.RENDER_WORKER_URL?.trim().replace(/\/$/, "") ?? "";
const workerSecret = () => process.env.WORKER_SHARED_SECRET?.trim() ?? "";

export const remoteWorkerConfigured = () => Boolean(workerUrl());

export const hasValidWorkerSecret = (candidate: string | null) => {
  const expected = workerSecret();
  if (!expected || !candidate) return false;
  const left = Buffer.from(candidate);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
};

const workerHeaders = (request?: Request) => {
  const secret = workerSecret();
  if (!secret) throw new Error("WORKER_SHARED_SECRET is required when RENDER_WORKER_URL is configured.");
  const headers = new Headers({
    "x-whiteboard-worker-secret": secret,
    accept: request?.headers.get("accept") ?? "application/json",
  });
  const contentType = request?.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  return headers;
};

const workerEndpoint = (request: Request) => {
  const baseUrl = workerUrl();
  if (!baseUrl) return "";
  const url = new URL(request.url);
  return `${baseUrl}${url.pathname}${url.search}`;
};

/** Returns undefined when this runtime is the worker, otherwise forwards the request. */
export const proxyToRenderWorker = async (request: Request): Promise<Response | undefined> => {
  if (!remoteWorkerConfigured()) return undefined;
  const method = request.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();
  const response = await fetch(workerEndpoint(request), {
    method,
    headers: workerHeaders(request),
    body,
    cache: "no-store",
    redirect: "manual",
    signal: AbortSignal.timeout(60_000),
  });
  const headers = new Headers(response.headers);
  headers.delete("set-cookie");
  return new Response(response.body, {status: response.status, statusText: response.statusText, headers});
};

/** Server-component reads use this instead of a browser-visible API request. */
export const fetchFromRenderWorker = async <T>(pathname: string): Promise<T | undefined> => {
  if (!remoteWorkerConfigured()) return undefined;
  const secret = workerSecret();
  if (!secret) throw new Error("WORKER_SHARED_SECRET is required when RENDER_WORKER_URL is configured.");
  const response = await fetch(`${workerUrl()}${pathname}`, {
    headers: {"x-whiteboard-worker-secret": secret, accept: "application/json"},
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Render worker returned HTTP ${response.status}.`);
  return await response.json() as T;
};
