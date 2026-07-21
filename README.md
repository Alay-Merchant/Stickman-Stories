# Book-to-Stickman Studio

Local-first studio for turning approved notes into a whiteboard teaching video, captions, and a publishing pack.

## Run

```powershell
npm install
Copy-Item .env.example .env
# Add provider keys, then put one licensed music file in public/music/
npm run dev
```

The app intentionally listens only on `127.0.0.1`. Project data defaults to the local application-data directory on Windows, rather than the repository or a synced Documents folder. Override it only when needed with `STUDIO_DATA_DIR`.

```powershell
npm run smoke
```

The smoke test uses deterministic local LLM/TTS stubs when no complete provider configuration is present, and renders both MP4 formats end-to-end. Set `SMOKE_STUB=0` with all provider credentials configured to exercise real providers.

## Production notes

- Keep `.env*` files private; only `.env.example` is intended for source control.
- Provide `FFMPEG_PATH` pointing to a current, trusted local FFmpeg build for production use.
- The app includes its own review and rendering workflow. The Remotion Studio server is deliberately not exposed as an npm script because its default network binding can disclose local environment variables on a LAN.
