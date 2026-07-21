import Link from "next/link";
import {notFound} from "next/navigation";

import {ProjectActions} from "./ProjectActions";
import {projectArtifacts} from "@/lib/workflow";

export const dynamic = "force-dynamic";

const statusOrder = ["created", "scripted", "storyboarded", "narrated", "rendered", "packaged"] as const;

export default async function ProjectPage({params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  let data: ReturnType<typeof projectArtifacts>;
  try {
    data = projectArtifacts(id);
  } catch {
    notFound();
  }
  const {project, brief, script, storyboard, pack, files} = data!;
  const stage = statusOrder.indexOf(project.status);
  const fileUrl = (name: string) => `/api/projects/${project.id}/file?name=${name}`;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10 sm:px-10">
      <Link className="text-sm font-bold text-[#2f80ed] hover:underline" href="/">← All projects</Link>
      <header className="mt-6 flex flex-wrap items-start justify-between gap-5 border-b-4 border-[#171717] pb-6">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#2f80ed]">{project.target.replace("_", " ")}</p>
          <h1 className="mt-1 text-4xl font-black">{project.title}</h1>
          <p className="mt-2 text-[#4a4a4a]">{project.author ? `${project.author} · ` : ""}{project.input_mode === "reference_only" ? "Reference-only — review each factual claim." : "Approved source notes"}</p>
        </div>
        <span className="rounded-full bg-[#f2c94c] px-4 py-2 font-bold capitalize">{project.status}</span>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
        <div className="space-y-6">
          <ProjectActions id={project.id} initialStatus={project.status} />

          <section className="rounded-2xl border-2 border-[#171717] bg-white p-5">
            <h2 className="text-xl font-black">Review script</h2>
            {brief && <p className="mt-2 rounded-lg bg-[#f1f7ff] p-3 text-sm"><span className="font-bold">Learning objective:</span> {brief.objective}</p>}
            {script ? (
              <ol className="mt-4 space-y-3">
                {script.sections.map((section, index) => (
                  <li className="rounded-xl border border-[#d8d8d4] p-4" key={`${section.purpose}-${index}`}>
                    <span className="text-xs font-bold uppercase tracking-wide text-[#2f80ed]">{section.purpose}</span>
                    <p className="mt-1 leading-7">{section.narration}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-[#4a4a4a]">Generate to create the teaching script.</p>
            )}
          </section>

          <section className="rounded-2xl border-2 border-[#171717] bg-white p-5">
            <h2 className="text-xl font-black">Review storyboard</h2>
            {storyboard ? (
              <div className="mt-4 grid gap-3">
                {storyboard.scenes.map((scene) => (
                  <article className="rounded-xl border border-[#d8d8d4] p-4" key={scene.scene_id}>
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="font-bold">Scene {scene.scene_id}</span>
                      <span className="text-sm text-[#4a4a4a]">{scene.duration_seconds.toFixed(1)} seconds · {scene.accent}</span>
                    </div>
                    <p className="mt-2">{scene.narration}</p>
                    <p className="mt-2 text-sm text-[#4a4a4a]">Visual: {scene.action} · {scene.background} · {[...scene.characters, ...scene.props].join(", ") || "No assets"}</p>
                    {scene.on_screen_text && <p className="mt-2 inline-block rounded bg-[#f2c94c] px-2 py-1 text-sm font-bold">{scene.on_screen_text}</p>}
                    {scene.review_status === "needs_review" && <p className="mt-2 text-sm font-bold text-[#a82727]">Needs asset review</p>}
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-[#4a4a4a]">The storyboard will appear after generation.</p>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border-2 border-[#171717] bg-[#171717] p-5 text-white">
            <h2 className="text-xl font-black">Progress</h2>
            <ol className="mt-4 space-y-3">
              {["Project", "Script + storyboard", "Narration", "Video + captions", "Publishing pack"].map((label, index) => (
                <li className="flex items-center gap-3" key={label}>
                  <span className={`grid h-7 w-7 place-items-center rounded-full font-bold ${stage >= Math.max(0, index - 1) ? "bg-[#27ae60]" : "bg-[#4a4a4a]"}`}>{index + 1}</span>
                  {label}
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl border-2 border-[#171717] bg-white p-5">
            <h2 className="text-xl font-black">Results</h2>
            <div className="mt-3 grid gap-2 text-sm font-bold">
              {files.video16x9 && <a className="rounded-lg bg-[#eefaf2] p-3 text-[#171717] hover:bg-[#d7f3df]" href={fileUrl("16x9")}>Download 16:9 video</a>}
              {files.video9x16 && <a className="rounded-lg bg-[#eefaf2] p-3 text-[#171717] hover:bg-[#d7f3df]" href={fileUrl("9x16")}>Download 9:16 video</a>}
              {files.captions && <a className="rounded-lg bg-[#f1f7ff] p-3 text-[#171717] hover:bg-[#dbeaff]" href={fileUrl("captions")}>Download captions (.srt)</a>}
              {pack && <a className="rounded-lg bg-[#fff8d9] p-3 text-[#171717] hover:bg-[#fff0ad]" href={fileUrl("pack")}>Download publishing pack</a>}
              {!files.video16x9 && !files.video9x16 && !files.captions && !pack && <p className="text-[#4a4a4a]">Finished files will appear here.</p>}
            </div>
          </section>

          {pack && (
            <section className="rounded-2xl border-2 border-[#171717] bg-white p-5">
              <h2 className="text-xl font-black">Publishing pack</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
                {pack.titles.map((title) => <li key={title.text}>{title.text}</li>)}
              </ol>
              <p className="mt-4 text-sm text-[#4a4a4a]">{pack.description}</p>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}
