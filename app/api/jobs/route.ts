import {NextResponse} from "next/server";

import {requireStudioAccess} from "@/lib/auth";
import {enqueueProjectJob, getProjectJob, PROJECT_JOB_ACTIONS} from "@/lib/jobs";
import {ACTION_REQUEST_MAX_BYTES, readJsonRequest} from "@/lib/request";
import {proxyToRenderWorker} from "@/lib/worker-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const errorResponse = (error: unknown, status = 400) =>
  NextResponse.json({error: error instanceof Error ? error.message : "The worker job could not be processed."}, {status});

export async function POST(request: Request) {
  try {
    requireStudioAccess(request);
    const proxied = await proxyToRenderWorker(request);
    if (proxied) return proxied;
    const body = (await readJsonRequest(request, ACTION_REQUEST_MAX_BYTES)) as {id?: unknown; action?: unknown};
    if (typeof body.id !== "string") throw new Error("A project id is required.");
    if (typeof body.action !== "string" || !PROJECT_JOB_ACTIONS.includes(body.action as (typeof PROJECT_JOB_ACTIONS)[number])) {
      throw new Error("Choose a valid project job.");
    }
    return NextResponse.json({job: enqueueProjectJob(body.id, body.action as (typeof PROJECT_JOB_ACTIONS)[number])}, {status: 202});
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(request: Request) {
  try {
    requireStudioAccess(request);
    const proxied = await proxyToRenderWorker(request);
    if (proxied) return proxied;
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw new Error("A job id is required.");
    return NextResponse.json({job: getProjectJob(id)});
  } catch (error) {
    return errorResponse(error, 404);
  }
}
