import Link from "next/link";

import {listProjects} from "@/lib/workflow";

export const dynamic = "force-dynamic";

const targetName: Record<string, string> = {
  yt_long: "YouTube long-form",
  yt_short: "YouTube Short",
  reel: "Instagram Reel",
  tiktok: "TikTok",
};

export default function ProjectsPage() {
  const projects = listProjects();
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12 sm:px-10">
      <header className="mb-12 flex flex-wrap items-end justify-between gap-6 border-b-4 border-[#171717] pb-7">
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-[#2f80ed]">Whiteboard v1</p>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Book-to-Stickman Studio</h1>
          <p className="mt-3 max-w-xl text-lg text-[#4a4a4a]">Turn approved notes into a reviewable teaching video, locally.</p>
        </div>
        <Link className="rounded-full bg-[#171717] px-6 py-3 font-bold text-white transition hover:bg-[#2f80ed]" href="/project/new">
          New project
        </Link>
      </header>

      {projects.length === 0 ? (
        <section className="rounded-3xl border-2 border-dashed border-[#4a4a4a] bg-white px-8 py-16 text-center">
          <h2 className="text-2xl font-bold">Start with a source or an idea</h2>
          <p className="mx-auto mt-3 max-w-md text-[#4a4a4a]">Paste licensed notes, or begin in reference-only mode and review every claim before publishing.</p>
          <Link className="mt-7 inline-block rounded-full bg-[#27ae60] px-5 py-3 font-bold text-white" href="/project/new">
            Create your first project
          </Link>
        </section>
      ) : (
        <section aria-label="Projects" className="grid gap-4">
          {projects.map((project) => (
            <Link
              className="group rounded-2xl border-2 border-[#171717] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#2f80ed] hover:shadow-[5px_5px_0_#2f80ed]"
              href={`/project/${project.id}`}
              key={project.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold group-hover:text-[#2f80ed]">{project.title}</h2>
                  <p className="mt-1 text-sm text-[#4a4a4a]">
                    {project.author ? `${project.author} · ` : ""}{targetName[project.target]} · {project.input_mode === "reference_only" ? "Reference-only" : "Source notes"}
                  </p>
                </div>
                <span className="rounded-full bg-[#f2c94c] px-3 py-1 text-sm font-bold capitalize">{project.status}</span>
              </div>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
