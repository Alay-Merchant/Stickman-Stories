import {NextResponse} from "next/server";

import {requireStudioAccess} from "@/lib/auth";
import {proxyToRenderWorker} from "@/lib/worker-proxy";
import {publicErrorMessage} from "@/lib/http";
import {runProjectQa} from "@/lib/workflow";

export const runtime = "nodejs";

export async function POST(request: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    requireStudioAccess(request);
    const proxied = await proxyToRenderWorker(request);
    if (proxied) return proxied;
    const {id} = await params;
    return NextResponse.json({qa: runProjectQa(id)});
  } catch (error) {
    return NextResponse.json({error: publicErrorMessage(error, "QA could not be run.")}, {status: 400});
  }
}
