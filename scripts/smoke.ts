import {existsSync, readFileSync} from "node:fs";
import path from "node:path";

const hasRealProviders = Boolean(
  process.env.OPENAI_API_KEY,
);

// A plain `npm run smoke` is always useful on a fresh clone. A creator who
// deliberately supplies an OpenAI key can opt into the live-provider path;
// SMOKE_STUB=1 always forces the deterministic CI path.
if (process.env.SMOKE_STUB === undefined) process.env.SMOKE_STUB = hasRealProviders ? "0" : "1";
if (!process.env.STUDIO_DATA_DIR) {
  process.env.STUDIO_DATA_DIR = path.join(process.cwd(), "data", "smoke", `${Date.now()}-${process.pid}`);
}

const fail = (message: string): never => {
  throw new Error(`Smoke check failed: ${message}`);
};

const srtSeconds = (clock: string) => {
  const match = /^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/.exec(clock.trim());
  if (!match) throw new Error(`Smoke check failed: invalid SRT timestamp ${clock}`);
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(match[4]) / 1000;
};

const checkSrt = (filePath: string, videoSeconds: number) => {
  const text = readFileSync(filePath, "utf8").trim();
  if (!text) fail("captions.srt is empty");
  const matches = Array.from(text.matchAll(/\d{2}:\d{2}:\d{2},\d{3}\s+-->\s+(\d{2}:\d{2}:\d{2},\d{3})/g));
  if (!matches.length) fail("captions.srt has no parseable cues");
  const last = srtSeconds(matches[matches.length - 1][1]);
  if (last > videoSeconds + 0.001) {
    fail(`last caption (${last.toFixed(3)}s) extends past video (${videoSeconds.toFixed(3)}s)`);
  }
};

const main = async () => {
  const {approveProject, createProject, generateProject, narrateProject, packageProject, renderProject} = await import("../lib/workflow");
  const {getProjectPaths, readJsonFile} = await import("../lib/project");
  const {Pack, Storyboard} = await import("../lib/schema");
  const {measureLoudness, probeMedia} = await import("../lib/ffmpeg");

  const source = readFileSync(path.join(process.cwd(), "fixtures", "sample-source.md"), "utf8");
  const project = createProject({
    title: "Smoke: Environment design",
    sourceText: source,
    inputMode: "text",
    target: "yt_short",
    rightsStatus: "creator_owned",
    settings: {music_license_note: "Deterministic smoke-only silent bed."},
  });
  const paths = getProjectPaths(project.id);

  const {storyboard: generated} = await generateProject(project.id);
  const storyboard = Storyboard.parse(readJsonFile(paths.storyboardJson));
  if (storyboard.scenes.length !== generated.scenes.length) fail("storyboard persisted with a different scene count");

  const registry = JSON.parse(readFileSync(path.join(process.cwd(), "assets", "manifest.json"), "utf8")) as {
    characters: Array<{id: string}>;
    props: Array<{id: string}>;
    backgrounds: Array<{id: string}>;
    placeholder: {id: string};
  };
  const assetIds = new Set([
    ...registry.characters.map((asset) => asset.id),
    ...registry.props.map((asset) => asset.id),
    ...registry.backgrounds.map((asset) => asset.id),
    registry.placeholder.id,
  ]);
  for (const scene of storyboard.scenes) {
    for (const id of [...scene.characters, ...scene.props, scene.background]) {
      if (!assetIds.has(id)) fail(`unknown asset reference ${id} in scene ${scene.scene_id}`);
    }
  }

  approveProject(project.id, "source");
  approveProject(project.id, "script");
  approveProject(project.id, "storyboard");

  const {audio, storyboard: audioFirstStoryboard} = await narrateProject(project.id);
  if (audio.length !== audioFirstStoryboard.scenes.length) fail("did not create one narration MP3 per scene");
  for (const audioPath of audio) {
    if (!existsSync(audioPath)) fail(`missing narration file ${audioPath}`);
    const media = await probeMedia(audioPath);
    if (!(media.duration > 0)) fail(`narration has no positive duration: ${audioPath}`);
  }

  approveProject(project.id, "storyboard");

  const rendered = await renderProject(project.id);
  if (!existsSync(rendered.export16)) fail("16x9 export is missing");
  const landscape = await probeMedia(rendered.export16);
  if (landscape.width !== 1920 || landscape.height !== 1080 || !landscape.hasAudio) {
    fail("16x9 export must be 1920x1080 with an audio stream");
  }
  if (!existsSync(rendered.export9)) fail("9x16 export is missing");
  const vertical = await probeMedia(rendered.export9);
  if (vertical.width !== 1080 || vertical.height !== 1920) {
    fail(`9x16 export is ${vertical.width}x${vertical.height}, expected 1080x1920`);
  }
  if (!vertical.hasAudio) fail("9x16 export has no audio stream");
  const summedDuration = audioFirstStoryboard.scenes.reduce((sum, scene) => sum + scene.duration_seconds, 0);
  if (Math.abs(vertical.duration - summedDuration) > summedDuration * 0.15) {
    fail(`video duration ${vertical.duration.toFixed(2)}s is not within 15% of storyboard duration ${summedDuration.toFixed(2)}s`);
  }
  const loudness = await measureLoudness(rendered.export9);
  if (!Number.isFinite(loudness) || Math.abs(loudness + 14) > 1.5) {
    fail(`integrated loudness ${loudness} LUFS is outside -14 ± 1.5 LUFS`);
  }
  if (!existsSync(rendered.captions)) fail("captions.srt is missing");
  checkSrt(rendered.captions, vertical.duration);

  const pack = Pack.parse(await packageProject(project.id));
  if (pack.titles.length < 3) fail("publishing pack has fewer than three titles");
  if (!existsSync(paths.packJson)) fail("pack.json is missing");

  process.stdout.write(
    `Smoke passed: ${audio.length} narration clips, ${vertical.width}x${vertical.height} MP4, ${vertical.duration.toFixed(2)}s, ${loudness.toFixed(1)} LUFS.\n`,
  );
};

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
