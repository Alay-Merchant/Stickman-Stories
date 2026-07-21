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
# One-time local Tortoise setup (NVIDIA GPU required)
.\scripts\setup-tortoise.ps1
# Add an Anthropic key and one licensed music track in public/music/
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

Smoke uses deterministic local LLM/TTS stubs if provider credentials are absent, but still renders both MP4 formats. Set `SMOKE_STUB=0` with an Anthropic key and Tortoise installed to exercise the live local voice path.

## Local Tortoise voice

Tortoise is the default TTS provider. Run `scripts/setup-tortoise.ps1` once; it creates an isolated Python environment at `%LOCALAPPDATA%\WhiteboardStudio\tortoise`, installs CUDA-enabled PyTorch and a pinned Tortoise revision, and downloads about 4.2 GB of model weights on the first synthesis. The RTX 3050 Ti uses the `ultra_fast` preset by default. A full storyboard is sent to Tortoise as one local batch, so it loads the model once per narration job rather than once per scene.

Set `TORTOISE_VOICE=random` for a synthetic random voice, or put one or more consented `.wav`/`.mp3` reference clips in `%LOCALAPPDATA%\WhiteboardStudio\tortoise\voices\your_voice` and set `TORTOISE_VOICE=your_voice`. Use only voices you have permission to synthesize.

## Hosting

Read [DEPLOYMENT.md](DEPLOYMENT.md) before deploying. Vercel or Netlify can host the protected Next.js editor; configure `RENDER_WORKER_URL` and the same private `WORKER_SHARED_SECRET` on it and the persistent worker. The editor then proxies all project actions to that worker, while PocketBase stores the private project snapshot. Do not place a multi-minute Remotion/FFmpeg job or PocketBase's data directory in a serverless function.

## Security

- Keep `.env` private. Production requires `STUDIO_ACCESS_TOKEN`, which protects the studio with an HTTP-only signed session cookie.
- The local app listens only on loopback. Remotion's temporary renderer server is also constrained to loopback.
- The UI intentionally does not expose absolute filesystem paths, provider keys, or raw source data to unauthenticated users.
- Use only source text, music, voices, fonts, and assets you have the right to use. Reference-only projects always require human fact checking.
