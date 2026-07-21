# Deployment handoff

## Recommended topology

```text
Vercel or Netlify
  └─ protected Next.js studio UI and lightweight APIs

Persistent worker (VM or container)
  └─ Node, Chromium/Remotion, FFmpeg, licensed music, mounted project volume

PocketBase (persistent VM or container)
  └─ private project/source/editorial snapshots and protected files
```

The studio began as a local-first renderer. That is intentional: a multi-minute Chromium + FFmpeg render needs a persistent disk, sufficient memory, and a long-running process. Vercel/Netlify functions are excellent for the editor, but are not a safe or reliable renderer host. PocketBase also needs a persistent `pb_data` volume, so deploy it separately from the serverless frontend.

## Vercel or Netlify editor

1. Import this repository and use the standard Next.js build command: `npm run build`.
2. Set every private value from `.env.example` in the platform's encrypted environment-variable dashboard. At minimum, set a long random `STUDIO_ACCESS_TOKEN` before making the deployment public.
3. Do not expose `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`, or `POCKETBASE_SUPERUSER_TOKEN` as browser variables. None of them should use a `NEXT_PUBLIC_` prefix.
4. Set `RENDER_WORKER_URL` to the HTTPS URL of the persistent worker and set a long random `WORKER_SHARED_SECRET`. Set exactly the same worker secret on the worker, but leave `RENDER_WORKER_URL` unset there. This makes every authenticated editor API call and server-rendered project read pass through the worker without exposing its credentials to the browser.

## PocketBase

1. Run a current PocketBase binary on a persistent host and copy `pocketbase/pb_migrations` beside it.
2. Start PocketBase once to apply the migration, create a `studio_users` owner record, then set `POCKETBASE_URL`, `POCKETBASE_SUPERUSER_TOKEN`, and `POCKETBASE_OWNER_ID` in the worker/editor.
3. Keep `studio_projects.source_file` and `studio_projects.artifacts` protected. Configure S3-compatible file storage for larger exports rather than relying on a small local disk.
4. Turn on PocketBase's rate limiter, backups, SMTP, encryption setting, MFA, and superuser IP allowlist. Review its changelog before each upgrade because it is still pre-1.0.

## Renderer worker

Run the current application on a VM/container with:

- Node 20.9+ and enough RAM for Chromium/Remotion;
- a trusted current FFmpeg configured with `FFMPEG_PATH`;
- persistent `STUDIO_DATA_DIR` and a licensed music directory at `public/music`;
- provider credentials and the same private access configuration;
- `WORKER_SHARED_SECRET` matching the serverless editor (leave `RENDER_WORKER_URL` unset on the worker); and
- HTTPS reverse proxying to a loopback-bound app process.

Run `npm run smoke` on the worker image/host before its first real render. Do not publish original source material, generated project metadata, or exports from a public bucket without an explicit access rule.
