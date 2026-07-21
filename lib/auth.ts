import {createHmac, timingSafeEqual} from "node:crypto";

import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import {hasValidWorkerSecret} from "./worker-proxy";

export const STUDIO_SESSION_COOKIE = "whiteboard_studio_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

const configuredSecret = () => process.env.STUDIO_ACCESS_TOKEN?.trim() ?? "";
const protectionRequired = () => process.env.NODE_ENV === "production" || Boolean(configuredSecret());

const encode = (value: string) => Buffer.from(value, "utf8").toString("base64url");
const decode = (value: string) => Buffer.from(value, "base64url").toString("utf8");
const signature = (payload: string, secret: string) => createHmac("sha256", secret).update(payload).digest("base64url");

export const createStudioSession = () => {
  const secret = configuredSecret();
  if (!secret) throw new Error("STUDIO_ACCESS_TOKEN must be configured before enabling hosted access.");
  const payload = encode(JSON.stringify({expires: Date.now() + SESSION_TTL_SECONDS * 1_000}));
  return `${payload}.${signature(payload, secret)}`;
};

export const hasValidStudioSession = (value: string | undefined) => {
  const secret = configuredSecret();
  if (!protectionRequired()) return true;
  if (!secret || !value) return false;
  const [payload, received] = value.split(".");
  if (!payload || !received) return false;
  const expected = signature(payload, secret);
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return false;
  try {
    const parsed = JSON.parse(decode(payload)) as {expires?: unknown};
    return typeof parsed.expires === "number" && parsed.expires > Date.now();
  } catch {
    return false;
  }
};

export const verifyAccessToken = (candidate: string) => {
  const secret = configuredSecret();
  if (!secret) return false;
  const left = Buffer.from(candidate);
  const right = Buffer.from(secret);
  return left.length === right.length && timingSafeEqual(left, right);
};

export const requireStudioAccess = (request: Request) => {
  if (hasValidWorkerSecret(request.headers.get("x-whiteboard-worker-secret"))) return;
  if (hasValidStudioSession(request.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${STUDIO_SESSION_COOKIE}=([^;]+)`))?.[1])) return;
  throw new Error("Studio sign-in is required.");
};

export const requireStudioPageAccess = async () => {
  if (hasValidStudioSession((await cookies()).get(STUDIO_SESSION_COOKIE)?.value)) return;
  redirect("/login");
};

export const studioAccessConfigured = () => Boolean(configuredSecret());
