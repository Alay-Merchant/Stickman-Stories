import {NextResponse} from "next/server";

import {requireStudioAccess} from "@/lib/auth";
import {proxyToRenderWorker} from "@/lib/worker-proxy";
import {publicErrorMessage} from "@/lib/http";
import {PROJECT_REQUEST_MAX_BYTES, readJsonRequest} from "@/lib/request";
import {saveScript} from "@/lib/workflow";

export const runtime = "nodejs";

export async function PUT(request: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    requireStudioAccess(request);
    const proxied = await proxyToRenderWorker(request);
    if (proxied) return proxied;
    const {id} = await params;
    const body = (await readJsonRequest(request, PROJECT_REQUEST_MAX_BYTES)) as {script?: unknown};
    return NextResponse.json({script: saveScript(id, body.script)});
  } catch (error) {
    return NextResponse.json({error: publicErrorMessage(error, "The script could not be saved.")}, {status: 400});
  }
}
