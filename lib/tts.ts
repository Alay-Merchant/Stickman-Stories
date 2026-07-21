import { spawn } from "node:child_process";
import { access, mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import ffmpegStatic from "ffmpeg-static";

/** A small provider boundary so routes do not need to know about a TTS SDK. */
export type TTSClip = { text: string; outPath: string };

export interface TTS {
  synthesize(text: string, outPath: string): Promise<{ seconds: number }>;
  /** Optional bulk path for a local provider that can keep a model resident. */
  synthesizeBatch?(clips: TTSClip[]): Promise<Array<{ seconds: number }>>;
}

export type TTSProvider = "tortoise" | "elevenlabs" | "stub";

type SpawnResult = { stdout: string; stderr: string };

const isTruthyEnv = (value: string | undefined) =>
  value === "1" || value?.toLowerCase() === "true";

const selectedProvider = (): TTSProvider => {
  // Keep `npm run smoke` hermetic even if a local .env selects ElevenLabs.
  if (isTruthyEnv(process.env.SMOKE_STUB)) return "stub";

  const value = (process.env.TTS_PROVIDER ?? "tortoise").trim().toLowerCase();
  if (value === "" || value === "default" || value === "tortoise") {
    return "tortoise";
  }
  if (value === "elevenlabs") {
    return "elevenlabs";
  }
  if (value === "stub") return "stub";

  throw new Error(
    `Unsupported TTS_PROVIDER \"${process.env.TTS_PROVIDER}\". Use \"tortoise\" (the default), \"elevenlabs\", or \"stub\".`,
  );
};

const unique = (items: Array<string | null | undefined>) =>
  Array.from(new Set(items.filter((item): item is string => Boolean(item))));

const run = (command: string, args: string[]): Promise<SpawnResult> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(`exit code ${code ?? "unknown"}: ${stderr.trim() || stdout.trim()}`));
    });
  });

const ffmpegCandidates = () =>
  unique([process.env.FFMPEG_PATH, ffmpegStatic ?? undefined, "ffmpeg"]);

const audioDurationWithFfmpeg = async (filePath: string): Promise<number> => {
  const errors: string[] = [];
  for (const ffmpeg of ffmpegCandidates()) {
    try {
      const { stderr } = await run(ffmpeg, [
        "-hide_banner",
        "-i",
        filePath,
        "-map",
        "0:a:0",
        "-c",
        "copy",
        "-f",
        "null",
        "-",
      ]);
      const match = stderr.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2})\.(\d+)/);
      const seconds = match
        ? Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(`0.${match[4]}`)
        : Number.NaN;
      if (Number.isFinite(seconds) && seconds > 0) return seconds;
      errors.push(`${ffmpeg}: returned an invalid duration`);
    } catch (error) {
      errors.push(`${ffmpeg}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(
    `Unable to measure audio duration for ${filePath}. Install dependencies so ffmpeg-static is available, set FFMPEG_PATH, or add FFmpeg to PATH. ${errors.join(" | ")}`,
  );
};

const ensureParentDirectory = async (outPath: string) => {
  await mkdir(path.dirname(path.resolve(outPath)), { recursive: true });
};

const defaultTortoiseRoot = () => {
  if (process.platform === "win32" && process.env.LOCALAPPDATA) {
    return path.join(process.env.LOCALAPPDATA, "WhiteboardStudio", "tortoise");
  }
  return undefined;
};

const tortoisePython = () => {
  const configured = process.env.TORTOISE_PYTHON?.trim();
  if (configured) return configured;
  const root = defaultTortoiseRoot();
  if (root) {
    return path.join(root, ".venv", "Scripts", "python.exe");
  }
  return "python3";
};

const tortoiseBridge = () => path.join(process.cwd(), "scripts", "tortoise_bridge.py");

const encodeTortoiseWav = async (source: string, destination: string) => {
  const errors: string[] = [];
  for (const ffmpeg of ffmpegCandidates()) {
    for (const encoder of ["libmp3lame", "mp3"]) {
      try {
        await run(ffmpeg, [
          "-hide_banner",
          "-loglevel",
          "error",
          "-i",
          source,
          "-vn",
          "-ac",
          "1",
          "-ar",
          "44100",
          "-c:a",
          encoder,
          "-b:a",
          "192k",
          "-y",
          destination,
        ]);
        return;
      } catch (error) {
        errors.push(`${ffmpeg} (${encoder}): ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  throw new Error(`Tortoise generated audio, but FFmpeg could not encode an MP3. ${errors.join(" | ")}`);
};

const readableHttpError = async (response: Response) => {
  const body = (await response.text()).replace(/\s+/g, " ").trim();
  return body ? `${response.status} ${response.statusText}: ${body.slice(0, 500)}` : `${response.status} ${response.statusText}`;
};

export class ElevenLabsTTS implements TTS {
  private readonly apiKey: string;
  private readonly voiceId: string;
  private readonly model: string;

  constructor(options: { apiKey?: string; voiceId?: string; model?: string } = {}) {
    const apiKey = options.apiKey ?? process.env.ELEVENLABS_API_KEY;
    const voiceId = options.voiceId ?? process.env.ELEVENLABS_VOICE_ID;
    if (!apiKey || !voiceId) {
      throw new Error(
        "ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID are required when TTS_PROVIDER=elevenlabs. Set TTS_PROVIDER=stub (or SMOKE_STUB=1) for a keyless local smoke run.",
      );
    }
    this.apiKey = apiKey;
    this.voiceId = voiceId;
    this.model = options.model ?? process.env.ELEVENLABS_MODEL ?? "eleven_multilingual_v2";
  }

  async synthesize(text: string, outPath: string): Promise<{ seconds: number }> {
    if (!text.trim()) throw new Error("Cannot synthesize an empty narration string.");
    await ensureParentDirectory(outPath);

    let response: Response;
    try {
      response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(this.voiceId)}/stream`,
        {
          method: "POST",
          headers: {
            Accept: "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": this.apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: this.model,
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        },
      );
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`ElevenLabs request failed: ${detail}`);
    }

    if (!response.ok) {
      throw new Error(`ElevenLabs synthesis failed: ${await readableHttpError(response)}`);
    }

    const data = Buffer.from(await response.arrayBuffer());
    if (data.length === 0) throw new Error("ElevenLabs synthesis failed: the provider returned an empty audio file.");
    await writeFile(outPath, data);

    try {
      return { seconds: await audioDurationWithFfmpeg(outPath) };
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`ElevenLabs produced audio but its duration could not be read: ${detail}`);
    }
  }
}

/**
 * Local NVIDIA-backed Tortoise adapter. Tortoise generates a temporary WAV;
 * the worker then encodes a normal MP3 so the existing render pipeline and
 * project layout stay unchanged. Only use voice samples you are authorised to
 * use and identify as synthetic in published work where appropriate.
 */
export class TortoiseTTS implements TTS {
  private readonly python: string;
  private readonly voice: string;
  private readonly preset: string;
  private readonly modelDir: string | undefined;
  private readonly voiceDir: string | undefined;

  constructor(options: { python?: string; voice?: string; preset?: string; modelDir?: string; voiceDir?: string } = {}) {
    this.python = options.python ?? tortoisePython();
    this.voice = options.voice ?? (process.env.TORTOISE_VOICE?.trim() || "random");
    this.preset = options.preset ?? (process.env.TORTOISE_PRESET?.trim() || "ultra_fast");
    const root = defaultTortoiseRoot();
    this.modelDir = options.modelDir ?? (process.env.TORTOISE_MODELS_DIR?.trim() || (root ? path.join(root, "models") : undefined));
    this.voiceDir = options.voiceDir ?? (process.env.TORTOISE_VOICE_DIR?.trim() || (root ? path.join(root, "voices") : undefined));
  }

  async synthesize(text: string, outPath: string): Promise<{ seconds: number }> {
    const [result] = await this.synthesizeBatch([{ text, outPath }]);
    return result;
  }

  async synthesizeBatch(clips: TTSClip[]): Promise<Array<{ seconds: number }>> {
    if (!clips.length) return [];
    for (const clip of clips) {
      if (!clip.text.trim()) throw new Error("Cannot synthesize an empty narration string.");
      await ensureParentDirectory(clip.outPath);
    }
    try {
      await access(this.python);
    } catch {
      throw new Error(`Tortoise is not installed at ${this.python}. Run scripts/setup-tortoise.ps1, or set TORTOISE_PYTHON to its Python executable.`);
    }

    const stem = `${path.resolve(clips[0].outPath)}.${process.pid}.${Date.now()}.tortoise`;
    const batchPath = `${stem}.json`;
    const wavPaths = clips.map((clip, index) => `${clip.outPath}.${process.pid}.${Date.now()}.${index}.tortoise.wav`);
    try {
      await writeFile(
        batchPath,
        JSON.stringify(clips.map((clip, index) => ({ text: clip.text, output: wavPaths[index] }))),
        "utf8",
      );
      const args = [
        tortoiseBridge(),
        "--batch-file",
        batchPath,
        "--voice",
        this.voice,
        "--preset",
        this.preset,
      ];
      if (this.modelDir) args.push("--models-dir", this.modelDir);
      if (this.voiceDir) args.push("--voice-dir", this.voiceDir);
      await run(this.python, args);
      const results: Array<{ seconds: number }> = [];
      for (let index = 0; index < clips.length; index += 1) {
        const clip = clips[index];
        const wav = await stat(wavPaths[index]);
        if (wav.size === 0) throw new Error(`Tortoise returned an empty WAV file for narration ${index + 1}.`);
        await encodeTortoiseWav(wavPaths[index], clip.outPath);
        results.push({ seconds: await audioDurationWithFfmpeg(clip.outPath) });
      }
      return results;
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`Tortoise synthesis failed: ${detail}`);
    } finally {
      await Promise.all([rm(batchPath, { force: true }), ...wavPaths.map((wavPath) => rm(wavPath, { force: true }))]);
    }
  }
}

const stubSecondsFor = (text: string) => {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  // Audible but brief: enough time for a scene and quick enough for CI.
  return Math.max(1, Math.min(3, 0.75 + words / 6));
};

/**
 * Keyless deterministic tone generator used by `SMOKE_STUB=1`. It tries the
 * bundled ffmpeg-static binary first, then a configured/system FFmpeg. The
 * output is a normal MP3 rather than an empty placeholder, so it exercises the
 * same audio and mux paths as a real provider.
 */
export class StubTTS implements TTS {
  async synthesize(text: string, outPath: string): Promise<{ seconds: number }> {
    if (!text.trim()) throw new Error("Cannot synthesize an empty narration string.");
    await ensureParentDirectory(outPath);
    const requestedSeconds = stubSecondsFor(text);
    const errors: string[] = [];

    for (const ffmpeg of ffmpegCandidates()) {
      for (const encoder of ["libmp3lame", "mp3"]) {
        try {
          await run(ffmpeg, [
            "-hide_banner",
            "-loglevel",
            "error",
            "-f",
            "lavfi",
            "-i",
            `sine=frequency=880:sample_rate=44100:duration=${requestedSeconds}`,
            "-ac",
            "1",
            "-c:a",
            encoder,
            "-b:a",
            "64k",
            "-y",
            outPath,
          ]);
          return { seconds: await audioDurationWithFfmpeg(outPath) };
        } catch (error) {
          errors.push(`${ffmpeg} (${encoder}): ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    throw new Error(
      "Stub TTS could not create an MP3. Install dependencies so ffmpeg-static is available, set FFMPEG_PATH to a working FFmpeg binary, or add ffmpeg to PATH. " +
        errors.join(" | "),
    );
  }
}

/** Creates the configured adapter. A new instance makes testing and overrides simple. */
export const createTTS = (): TTS => {
  switch (selectedProvider()) {
    case "tortoise":
      return new TortoiseTTS();
    case "elevenlabs":
      return new ElevenLabsTTS();
    case "stub":
      return new StubTTS();
  }
};

/** Backwards-friendly route-facing name. */
export const getTTS = createTTS;
