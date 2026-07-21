import {readFile} from "node:fs/promises";

import {NextResponse} from "next/server";

import {getProjectPaths} from "@/lib/project";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const files = {
  "16x9": {path: (id: string) => getProjectPaths(id).export16x9, type: "video/mp4", filename: "whiteboard-16x9.mp4"},
  "9x16": {path: (id: string) => getProjectPaths(id).export9x16, type: "video/mp4", filename: "whiteboard-9x16.mp4"},
  captions: {path: (id: string) => getProjectPaths(id).captions, type: "application/x-subrip; charset=utf-8", filename: "captions.srt"},
  pack: {path: (id: string) => getProjectPaths(id).packMarkdown, type: "text/markdown; charset=utf-8", filename: "publishing-pack.md"},
} as const;

export async function GET(request: Request, {params}: {params: Promise<{id: string}>}) {
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
