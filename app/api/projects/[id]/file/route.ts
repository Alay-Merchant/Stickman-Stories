import {readFile} from "node:fs/promises";

import {NextResponse} from "next/server";

import {requireStudioAccess} from "@/lib/auth";
import {getProjectPaths} from "@/lib/project";
import {proxyToRenderWorker} from "@/lib/worker-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const files = {
  "16x9": {path: (id: string) => getProjectPaths(id).export16x9, type: "video/mp4", filename: "whiteboard-16x9.mp4"},
  "9x16": {path: (id: string) => getProjectPaths(id).export9x16, type: "video/mp4", filename: "whiteboard-9x16.mp4"},
  captions: {path: (id: string) => getProjectPaths(id).captions, type: "application/x-subrip; charset=utf-8", filename: "captions.srt"},
  vtt: {path: (id: string) => getProjectPaths(id).captionsVtt, type: "text/vtt; charset=utf-8", filename: "captions.vtt"},
  pack: {path: (id: string) => getProjectPaths(id).packMarkdown, type: "text/markdown; charset=utf-8", filename: "publishing-pack.md"},
  thumbnail: {path: (id: string) => getProjectPaths(id).thumbnailSvg, type: "image/svg+xml", filename: "thumbnail.svg"},
  shorts: {path: (id: string) => getProjectPaths(id).shortsMarkdown, type: "text/markdown; charset=utf-8", filename: "short-candidates.md"},
} as const;

export async function GET(request: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    requireStudioAccess(request);
  } catch {
    return NextResponse.json({error: "Studio sign-in is required."}, {status: 401});
  }
  try {
    const proxied = await proxyToRenderWorker(request);
    if (proxied) return proxied;
  } catch {
    return NextResponse.json({error: "The render worker is not available."}, {status: 502});
  }
  const {id} = await params;
  const name = new URL(request.url).searchParams.get("name");
  if (!name || !(name in files)) return NextResponse.json({error: "Unknown project file."}, {status: 400});
  const file = files[name as keyof typeof files];
  try {
    const data = await readFile(file.path(id));
    return new NextResponse(data, {
      headers: {
        "Content-Type": file.type,
        "Content-Disposition": `attachment; filename="${file.filename}"`,
      },
    });
  } catch {
    return NextResponse.json({error: "That result is not available yet."}, {status: 404});
  }
}
