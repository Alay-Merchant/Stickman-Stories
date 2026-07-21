import {NextResponse} from "next/server";

import {requireStudioAccess} from "@/lib/auth";
import {proxyToRenderWorker} from "@/lib/worker-proxy";
import {publicErrorMessage} from "@/lib/http";
import {ACTION_REQUEST_MAX_BYTES, readJsonRequest} from "@/lib/request";
import {approveProject} from "@/lib/workflow";

export const runtime = "nodejs";

export async function POST(request: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    requireStudioAccess(request);
    const proxied = await proxyToRenderWorker(request);
    if (proxied) return proxied;
    const {id} = await params;
    const body = (await readJsonRequest(request, ACTION_REQUEST_MAX_BYTES)) as {gate?: unknown};
    if (body.gate !== "source" && body.gate !== "script" && body.gate !== "storyboard") throw new Error("Choose a valid review gate.");
    const {dir: _dir, ...project} = approveProject(id, body.gate);
    return NextResponse.json({project});
  } catch (error) {
    return NextResponse.json({error: publicErrorMessage(error, "The approval could not be saved.")}, {status: 400});
  }
}
