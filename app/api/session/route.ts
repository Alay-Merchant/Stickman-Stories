import {NextResponse} from "next/server";

import {createStudioSession, STUDIO_SESSION_COOKIE, studioAccessConfigured, verifyAccessToken} from "@/lib/auth";
import {readJsonRequest} from "@/lib/request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!studioAccessConfigured()) {
      return NextResponse.json({error: "Set STUDIO_ACCESS_TOKEN before using hosted sign-in."}, {status: 503});
    }
    const body = (await readJsonRequest(request, 2_000)) as {accessToken?: unknown};
    if (typeof body.accessToken !== "string" || !verifyAccessToken(body.accessToken)) {
      return NextResponse.json({error: "That studio access token is not valid."}, {status: 401});
    }
    const response = NextResponse.json({ok: true});
    response.cookies.set({
      name: STUDIO_SESSION_COOKIE,
      value: createStudioSession(),
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({error: "Could not start the studio session."}, {status: 400});
  }
}

export async function DELETE() {
  const response = NextResponse.json({ok: true});
  response.cookies.set({name: STUDIO_SESSION_COOKIE, value: "", maxAge: 0, path: "/"});
  return response;
}
