import {NextResponse} from "next/server";

import {requireStudioAccess} from "@/lib/auth";
import {proxyToRenderWorker} from "@/lib/worker-proxy";
import {publicErrorMessage} from "@/lib/http";
import {syncProjectToPocketBase} from "@/lib/pocketbase";

export const runtime = "nodejs";

export async function POST(request: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    requireStudioAccess(request);
    const proxied = await proxyToRenderWorker(request);
    if (proxied) return proxied;
    const {id} = await params;
    const result = await syncProjectToPocketBase(id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({error: publicErrorMessage(error, "PocketBase sync could not finish.")}, {status: 502});
  }
}
