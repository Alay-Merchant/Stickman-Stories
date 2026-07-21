const sameOrigin = (request: Request) => {
  const origin = request.headers.get("origin");
  // Programmatic/local callers (including the smoke check) do not send Origin.
  // Browser mutations must be same-origin to avoid cross-site form/fetch abuse.
  if (origin && origin !== new URL(request.url).origin) {
    throw new Error("Cross-origin requests are not allowed by this local studio.");
  }
};

export const readJsonRequest = async (request: Request, maxBytes: number): Promise<unknown> => {
  sameOrigin(request);
  const type = request.headers.get("content-type");
  if (type && !type.toLowerCase().includes("application/json")) {
    throw new Error("This endpoint accepts application/json requests only.");
  }
  const contentLength = request.headers.get("content-length");
  const declaredBytes = contentLength ? Number(contentLength) : undefined;
  if (declaredBytes !== undefined && (!Number.isSafeInteger(declaredBytes) || declaredBytes < 0 || declaredBytes > maxBytes)) {
    throw new Error("The request is too large.");
  }
  const reader = request.body?.getReader();
  if (!reader) throw new Error("A JSON request body is required.");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    for (;;) {
      const {done, value} = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        throw new Error("The request is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8");
  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new Error("The request body must be valid JSON.");
  }
};

export const PROJECT_REQUEST_MAX_BYTES = 2_500_000;
export const ACTION_REQUEST_MAX_BYTES = 16_000;
