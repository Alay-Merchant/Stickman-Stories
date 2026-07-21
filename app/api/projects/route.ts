import {NextResponse} from "next/server";

import {INPUT_MODES} from "@/lib/project";
import {requireStudioAccess} from "@/lib/auth";
import {proxyToRenderWorker} from "@/lib/worker-proxy";
import {PROJECT_REQUEST_MAX_BYTES, readJsonRequest} from "@/lib/request";
import {Target} from "@/lib/schema";
import {createProject, listProjects} from "@/lib/workflow";
import {publicErrorMessage} from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const errorResponse = (error: unknown, status = 400) =>
  NextResponse.json({error: publicErrorMessage(error, "The project request could not be completed.")}, {status});

export async function GET(request: Request) {
  try {
    requireStudioAccess(request);
    const proxied = await proxyToRenderWorker(request);
    if (proxied) return proxied;
    const projects = listProjects().map(({dir: _dir, ...project}) => project);
    return NextResponse.json({projects});
  } catch (error) {
    return errorResponse(error, 500);
  }
}

export async function POST(request: Request) {
  try {
    requireStudioAccess(request);
    const proxied = await proxyToRenderWorker(request);
    if (proxied) return proxied;
    const body = (await readJsonRequest(request, PROJECT_REQUEST_MAX_BYTES)) as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title : "";
    const author = typeof body.author === "string" ? body.author : undefined;
    const sourceText = typeof body.sourceText === "string" ? body.sourceText : undefined;
    const inputMode = typeof body.inputMode === "string" && INPUT_MODES.includes(body.inputMode as (typeof INPUT_MODES)[number])
      ? (body.inputMode as (typeof INPUT_MODES)[number])
      : undefined;
    const target = Target.parse(body.target);
    const {dir: _dir, ...project} = createProject({title, author, sourceText, inputMode, target});
    return NextResponse.json({project}, {status: 201});
  } catch (error) {
    return errorResponse(error);
  }
}
