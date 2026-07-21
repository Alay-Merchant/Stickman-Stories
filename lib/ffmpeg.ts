import {spawn} from "node:child_process";
import {existsSync} from "node:fs";
import {copyFile, mkdir, readdir, writeFile} from "node:fs/promises";
import {createRequire} from "node:module";
import path from "node:path";
import ffmpegStatic from "ffmpeg-static";
import {bundle} from "@remotion/bundler";
import {renderMedia, selectComposition} from "@remotion/renderer";
import type {Storyboard as StoryboardValue} from "./schema";

export type RenderStoryboard = StoryboardValue;

type MediaProbe = {
  duration: number;
  width?: number;
  height?: number;
  hasAudio: boolean;
};

const executable = (configured: string | undefined, bundled: string | null, label: string) => {
  const result = configured || bundled;
  if (!result) {
    throw new Error(`${label} is unavailable. Set the matching environment variable and try again.`);
  }
  return result;
};

export const ffmpegPath = () => executable(process.env.FFMPEG_PATH, ffmpegStatic, "FFmpeg");

export const runProcess = (
  command: string,
  args: string[],
  options: {cwd?: string; quiet?: boolean} = {},
): Promise<{stdout: string; stderr: string}> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => reject(error));
    child.on("close", (code) => {
      if (code === 0) {
        resolve({stdout, stderr});
        return;
      }
      const detail = stderr.trim().slice(-4000);
      reject(new Error(`${path.basename(command)} exited with ${code ?? "an unknown error"}.${detail ? `\n${detail}` : ""}`));
    });
  });

export const probeMedia = async (filePath: string): Promise<MediaProbe> => {
  // ffprobe-static ships an old, separately maintained executable. Reuse the
  // current FFmpeg binary that performs the render instead of adding that
  // second stale binary to the local threat surface.
  const {stderr} = await runProcess(ffmpegPath(), [
    "-hide_banner",
    "-i",
    filePath,
    "-map",
    "0",
    "-c",
    "copy",
    "-f",
    "null",
    "-",
  ]);
  const durationMatch = stderr.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2})\.(\d+)/);
  if (!durationMatch) throw new Error(`FFmpeg could not determine the duration of ${path.basename(filePath)}.`);
  const duration = Number(durationMatch[1]) * 3600 + Number(durationMatch[2]) * 60 + Number(durationMatch[3]) + Number(`0.${durationMatch[4]}`);
  const videoMatch = stderr.match(/Video:.*?\s(\d{2,5})x(\d{2,5})(?:\s|\[)/);
  return {
    duration,
    width: videoMatch ? Number(videoMatch[1]) : undefined,
    height: videoMatch ? Number(videoMatch[2]) : undefined,
    hasAudio: /Stream #\d+:\d+(?:\([^)]*\))?: Audio:/i.test(stderr),
  };
};

const asConcatLine = (filePath: string) => `file '${filePath.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`;

export const concatNarration = async (audioPaths: string[], outPath: string) => {
  if (!audioPaths.length) {
    throw new Error("The storyboard has no narration clips to combine.");
  }
  const listPath = path.join(path.dirname(outPath), "concat.txt");
  await writeFile(listPath, `${audioPaths.map(asConcatLine).join("\n")}\n`, "utf8");
  await runProcess(ffmpegPath(), [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    listPath,
    "-vn",
    "-ac",
    "2",
    "-ar",
    "48000",
    "-c:a",
    "pcm_s16le",
    outPath,
  ]);
  return outPath;
};

const musicExtensions = new Set([".mp3", ".m4a", ".aac", ".wav", ".ogg"]);

const isStubRun = () => ["1", "true"].includes(process.env.SMOKE_STUB?.toLowerCase() ?? "") || process.env.LLM_PROVIDER === "stub" || process.env.TTS_PROVIDER === "stub";

const resolveMusicBed = async (projectDir: string, seconds: number) => {
  const musicDir = path.join(process.cwd(), "public", "music");
  if (existsSync(musicDir)) {
    const file = (await readdir(musicDir)).find((entry) => musicExtensions.has(path.extname(entry).toLowerCase()));
    if (file) return path.join(musicDir, file);
  }

  if (!isStubRun()) {
    throw new Error("Add one licensed music file to public/music before rendering.");
  }

  const generated = path.join(projectDir, "audio", "smoke-bed.wav");
  await runProcess(ffmpegPath(), [
    "-y",
    "-f",
    "lavfi",
    "-i",
    "anullsrc=channel_layout=stereo:sample_rate=48000",
    "-t",
    String(Math.max(seconds, 1)),
    "-c:a",
    "pcm_s16le",
    generated,
  ]);
  return generated;
};

let remotionBundle: Promise<string> | undefined;
let remotionLoopbackLocked = false;
const requireFromRenderer = createRequire(import.meta.url);

type RemotionPortConfigModule = {
  getPortConfig: (forceIpv4: boolean) => {host: string; hostsToTry: string[]};
};

// Remotion's renderer normally binds its short-lived asset server to every
// interface. Lock it to the loopback interface before every render so a local
// project source/props bundle is never briefly reachable from the LAN. This
// uses a pinned renderer version because port-config is an internal module.
const lockRemotionRendererToLoopback = () => {
  if (remotionLoopbackLocked) return;
  const rendererEntry = requireFromRenderer.resolve(/* turbopackIgnore: true */ "@remotion/renderer");
  const portConfigPath = path.join(path.dirname(rendererEntry), "port-config.js");
  const portConfig = Reflect.apply(requireFromRenderer, undefined, [portConfigPath]) as RemotionPortConfigModule;
  portConfig.getPortConfig = () => ({host: "127.0.0.1", hostsToTry: ["127.0.0.1"]});
  remotionLoopbackLocked = true;
};

const getBundle = (): Promise<string> => {
  if (!remotionBundle) {
    remotionBundle = bundle({
      entryPoint: path.join(process.cwd(), "remotion", "Root.tsx"),
      onProgress: () => undefined,
    });
  }
  return remotionBundle;
};

const renderVisual = async (storyboard: RenderStoryboard, target: "16x9" | "9x16", outPath: string) => {
  lockRemotionRendererToLoopback();
  const serveUrl = await getBundle();
  const compositionId = target === "16x9" ? "Whiteboard16x9" : "Whiteboard9x16";
  const inputProps = {storyboard, audio: [] as string[]};
  const composition = await selectComposition({
    serveUrl,
    id: compositionId,
    inputProps,
  });
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: outPath,
    inputProps,
    concurrency: 1,
    imageFormat: "jpeg",
    chromiumOptions: {gl: "angle"},
  });
};

const mixAndEncode = async ({
  visualPath,
  narrationPath,
  musicPath,
  duration,
  outPath,
}: {
  visualPath: string;
  narrationPath: string;
  musicPath: string;
  duration: number;
  outPath: string;
}) => {
  const filter = [
    `[1:a]aresample=48000,pan=stereo|c0=c0|c1=c0,apad=pad_dur=${Math.max(duration, 1).toFixed(3)},atrim=duration=${Math.max(duration, 1).toFixed(3)}[voice]`,
    "[voice]asplit=2[voice_duck][voice_mix]",
    `[2:a]aresample=48000,volume=0.08,atrim=duration=${Math.max(duration, 1).toFixed(3)}[music]`,
    "[music][voice_duck]sidechaincompress=threshold=0.02:ratio=8:attack=15:release=300[ducked]",
    "[voice_mix][ducked]amix=inputs=2:duration=first:normalize=0[mix]",
    "[mix]loudnorm=I=-14:TP=-1:LRA=11[audio]",
  ].join(";");
  await runProcess(ffmpegPath(), [
    "-y",
    "-i",
    visualPath,
    "-i",
    narrationPath,
    "-stream_loop",
    "-1",
    "-i",
    musicPath,
    "-filter_complex",
    filter,
    "-map",
    "0:v:0",
    "-map",
    "[audio]",
    "-shortest",
    "-c:v",
    "libx264",
    "-profile:v",
    "high",
    "-pix_fmt",
    "yuv420p",
    "-crf",
    "18",
    "-c:a",
    "aac",
    "-ar",
    "48000",
    "-b:a",
    "192k",
    "-movflags",
    "+faststart",
    outPath,
  ]);
};

const srtClock = (seconds: number, end = false) => {
  // FFmpeg container metadata is often reported at centisecond precision while
  // Remotion frames land at 33.3 ms intervals. End each cue 20 ms early so a
  // valid caption never numerically outlasts its encoded MP4 on any probe.
  const milliseconds = Math.max(0, Math.floor(seconds * 1000) - (end ? 20 : 0));
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  const secs = Math.floor((milliseconds % 60_000) / 1000);
  const ms = milliseconds % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
};

export const writeCaptions = async (storyboard: RenderStoryboard, outPath: string) => {
  let from = 0;
  const cues = storyboard.scenes.map((scene, index) => {
    // Remotion rounds every Sequence to a whole 30 fps frame. Match that
    // timeline exactly so the final SRT can never outlast the rendered video.
    const to = from + Math.round(scene.duration_seconds * 30) / 30;
    const cue = `${index + 1}\n${srtClock(from)} --> ${srtClock(to, true)}\n${scene.narration.trim()}\n`;
    from = to;
    return cue;
  });
  await writeFile(outPath, `${cues.join("\n")}\n`, "utf8");
  return {outPath, duration: from};
};

export const renderStoryboard = async ({
  projectDir,
  storyboard,
  audioPaths,
}: {
  projectDir: string;
  storyboard: RenderStoryboard;
  audioPaths: string[];
}) => {
  const rendersDir = path.join(projectDir, "renders");
  const exportsDir = path.join(projectDir, "exports");
  const audioDir = path.join(projectDir, "audio");
  await Promise.all([mkdir(rendersDir, {recursive: true}), mkdir(exportsDir, {recursive: true}), mkdir(audioDir, {recursive: true})]);

  const totalDuration = storyboard.scenes.reduce((total, scene) => total + Math.round(scene.duration_seconds * 30) / 30, 0);
  const narrationPath = await concatNarration(audioPaths, path.join(audioDir, "narration.wav"));
  const musicPath = await resolveMusicBed(projectDir, totalDuration);
  const visual16 = path.join(rendersDir, "master-visual.mp4");
  const visual9 = path.join(rendersDir, "vertical-visual.mp4");
  const master = path.join(rendersDir, "master.mp4");
  const export16 = path.join(exportsDir, "16x9.mp4");
  const export9 = path.join(exportsDir, "9x16.mp4");

  await renderVisual(storyboard, "16x9", visual16);
  await renderVisual(storyboard, "9x16", visual9);
  await mixAndEncode({visualPath: visual16, narrationPath, musicPath, duration: totalDuration, outPath: master});
  await copyFile(master, export16);
  await mixAndEncode({visualPath: visual9, narrationPath, musicPath, duration: totalDuration, outPath: export9});
  const captions = await writeCaptions(storyboard, path.join(exportsDir, "captions.srt"));
  return {master, export16, export9, captions: captions.outPath, duration: captions.duration};
};

export const measureLoudness = async (filePath: string) => {
  const {stderr} = await runProcess(ffmpegPath(), [
    "-hide_banner",
    "-i",
    filePath,
    "-filter_complex",
    "loudnorm=I=-14:TP=-1:LRA=11:print_format=json",
    "-f",
    "null",
    "-",
  ]);
  const match = stderr.match(/\{\s*"input_i"[\s\S]*?\}/);
  if (!match) throw new Error("FFmpeg did not return a loudness measurement.");
  const parsed = JSON.parse(match[0]) as {input_i?: string};
  return Number(parsed.input_i);
};
