# Book-to-Stickman Studio

Private creator studio for turning approved source material into an original whiteboard teaching video, accessible captions, a thumbnail draft, and a publishing package.

## What is ready

- Source map, source-rights status, human review gates, revision snapshots, and scene-level source references.
- Editable brief, script, storyboard, assets, voice notes, captions, QA, 16:9 and 9:16 exports, SRT/VTT, thumbnail SVG, short candidates, and publishing copy.
- Local Remotion + FFmpeg render pipeline with audio-first timing and loudness normalisation.
- Optional private PocketBase snapshot bridge; see [pocketbase/README.md](pocketbase/README.md).

## Local run

```powershell
npm.cmd install
Copy-Item .env.example .env
# Add provider keys and one licensed music track in public/music/
npm.cmd run dev
```

Open `http://127.0.0.1:3000`. Project files default to local application data on Windows, outside the repository. Use `STUDIO_DATA_DIR` only when you deliberately need a different location.

The first real video flow is:

1. Create a project and set its source-rights status.
2. Generate the editable brief, script, and storyboard.
3. Review and mark source, script, and storyboard as approved.
4. Make narration, re-check the timing, approve the storyboard again, then render.
5. Generate the publishing package and download the exports.

```powershell
npm.cmd run smoke
```

Smoke uses deterministic local LLM/TTS stubs if provider credentials are absent, but still renders both MP4 formats. Set `SMOKE_STUB=0` with complete provider credentials to exercise live providers.

## Hosting

Read [DEPLOYMENT.md](DEPLOYMENT.md) before deploying. Vercel or Netlify can host the protected Next.js editor; configure `RENDER_WORKER_URL` and the same private `WORKER_SHARED_SECRET` on it and the persistent worker. The editor then proxies all project actions to that worker, while PocketBase stores the private project snapshot. Do not place a multi-minute Remotion/FFmpeg job or PocketBase's data directory in a serverless function.

## Security

- Keep `.env` private. Production requires `STUDIO_ACCESS_TOKEN`, which protects the studio with an HTTP-only signed session cookie.
- The local app listens only on loopback. Remotion's temporary renderer server is also constrained to loopback.
- The UI intentionally does not expose absolute filesystem paths, provider keys, or raw source data to unauthenticated users.
- Use only source text, music, voices, fonts, and assets you have the right to use. Reference-only projects always require human fact checking.
