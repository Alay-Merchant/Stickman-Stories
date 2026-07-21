import {NextResponse} from "next/server";

import {publicErrorMessage} from "@/lib/http";
import {packageProject} from "@/lib/workflow";
import {ACTION_REQUEST_MAX_BYTES, readJsonRequest} from "@/lib/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const {id} = (await readJsonRequest(request, ACTION_REQUEST_MAX_BYTES)) as {id?: unknown};
    if (typeof id !== "string") throw new Error("A project id is required.");
    return NextResponse.json(await packageProject(id));
  } catch (error) {
    return NextResponse.json({error: publicErrorMessage(error, "Publishing-pack generation failed. Check the local provider settings and try again.")}, {status: 400});
  }
}
