import {NextResponse} from "next/server";

import {requireStudioAccess} from "@/lib/auth";
import {proxyToRenderWorker} from "@/lib/worker-proxy";
import {publicErrorMessage} from "@/lib/http";
import {INPUT_MODES} from "@/lib/project";
import {ProjectSettings, RightsStatus, Target} from "@/lib/schema";
import {PROJECT_REQUEST_MAX_BYTES, readJsonRequest} from "@/lib/request";
import {projectArtifacts, updateProject} from "@/lib/workflow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const responseData = (id: string) => {
  const data = projectArtifacts(id);
  const {dir: _dir, ...project} = data.project;
  return {...data, project};
};

export async function GET(request: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    requireStudioAccess(request);
    const proxied = await proxyToRenderWorker(request);
    if (proxied) return proxied;
    const {id} = await params;
    return NextResponse.json(responseData(id));
  } catch (error) {
    return NextResponse.json({error: publicErrorMessage(error, "The project could not be loaded.")}, {status: 404});
  }
}

export async function PATCH(request: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    requireStudioAccess(request);
    const proxied = await proxyToRenderWorker(request);
    if (proxied) return proxied;
    const {id} = await params;
    const body = (await readJsonRequest(request, PROJECT_REQUEST_MAX_BYTES)) as Record<string, unknown>;
    const settings = body.settings && typeof body.settings === "object" && !Array.isArray(body.settings)
      ? ProjectSettings.partial().parse(body.settings)
      : undefined;
    updateProject(id, {
      title: typeof body.title === "string" ? body.title : undefined,
      author: typeof body.author === "string" ? body.author : body.author === null ? null : undefined,
      sourceText: typeof body.sourceText === "string" ? body.sourceText : undefined,
      inputMode: typeof body.inputMode === "string" && INPUT_MODES.includes(body.inputMode as (typeof INPUT_MODES)[number])
        ? body.inputMode as (typeof INPUT_MODES)[number]
        : undefined,
      target: body.target === undefined ? undefined : Target.parse(body.target),
      rightsStatus: body.rightsStatus === undefined ? undefined : RightsStatus.parse(body.rightsStatus),
      settings,
    });
    return NextResponse.json(responseData(id));
  } catch (error) {
    return NextResponse.json({error: publicErrorMessage(error, "The project could not be saved.")}, {status: 400});
  }
}
