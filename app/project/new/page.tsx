"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";

type Target = "yt_long" | "yt_short" | "reel" | "tiktok";

const targetOptions: Array<{value: Target; label: string; help: string}> = [
  {value: "yt_short", label: "YouTube Short", help: "9:16 · up to 60 seconds"},
  {value: "yt_long", label: "YouTube long-form", help: "16:9 · 5–10 minutes"},
  {value: "reel", label: "Instagram Reel", help: "9:16 · concise lesson"},
  {value: "tiktok", label: "TikTok", help: "9:16 · fast hook"},
];

export default function NewProjectPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [referenceOnly, setReferenceOnly] = useState(true);
  const [target, setTarget] = useState<Target>("yt_short");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          title,
          author,
          sourceText,
          inputMode: referenceOnly ? "reference_only" : "text",
          target,
        }),
      });
      const data = (await response.json()) as {project?: {id: string}; error?: string};
      if (!response.ok || !data.project) throw new Error(data.error ?? "Could not create the project.");
      router.push(`/project/${data.project.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create the project.");
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-12">
      <a className="text-sm font-bold text-[#2f80ed] hover:underline" href="/">← All projects</a>
      <h1 className="mt-6 text-4xl font-black">Create a project</h1>
      <p className="mt-2 text-[#4a4a4a]">Choose the output first. Source notes are optional; you can create a reference-only brief instead.</p>
      <form className="mt-8 space-y-7 rounded-3xl border-2 border-[#171717] bg-white p-6 sm:p-8" onSubmit={submit}>
        <label className="block">
          <span className="font-bold">Project title</span>
          <input className="mt-2 w-full rounded-xl border-2 border-[#171717] px-4 py-3 outline-none focus:border-[#2f80ed]" onChange={(event) => setTitle(event.target.value)} placeholder="Designing better habits" required value={title} />
        </label>
        <label className="block">
          <span className="font-bold">Author (optional)</span>
          <input className="mt-2 w-full rounded-xl border-2 border-[#171717] px-4 py-3 outline-none focus:border-[#2f80ed]" onChange={(event) => setAuthor(event.target.value)} placeholder="Author name" value={author} />
        </label>
        <fieldset>
          <legend className="font-bold">Source mode</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className={`cursor-pointer rounded-xl border-2 p-4 ${!referenceOnly ? "border-[#27ae60] bg-[#eefaf2]" : "border-[#171717]"}`}>
              <input checked={!referenceOnly} className="mr-2" name="sourceMode" onChange={() => setReferenceOnly(false)} type="radio" />
              <span className="font-bold">Use source notes</span>
              <span className="mt-1 block text-sm text-[#4a4a4a]">Optional: paste Markdown or text you may use.</span>
            </label>
            <label className={`cursor-pointer rounded-xl border-2 p-4 ${referenceOnly ? "border-[#eb5757] bg-[#fff3f3]" : "border-[#171717]"}`}>
              <input checked={referenceOnly} className="mr-2" name="sourceMode" onChange={() => setReferenceOnly(true)} type="radio" />
              <span className="font-bold">No source notes</span>
              <span className="mt-1 block text-sm text-[#4a4a4a]">Create a reference-only brief; fact-check claims before publishing.</span>
            </label>
          </div>
        </fieldset>
        {!referenceOnly && (
          <label className="block">
            <span className="font-bold">Source notes</span>
            <textarea className="mt-2 min-h-56 w-full rounded-xl border-2 border-[#171717] px-4 py-3 outline-none focus:border-[#2f80ed]" onChange={(event) => setSourceText(event.target.value)} placeholder="Paste permitted notes or Markdown…" required value={sourceText} />
          </label>
        )}
        <fieldset>
          <legend className="font-bold">Target</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {targetOptions.map((option) => (
              <label className={`cursor-pointer rounded-xl border-2 p-4 ${target === option.value ? "border-[#2f80ed] bg-[#f1f7ff]" : "border-[#171717]"}`} key={option.value}>
                <input checked={target === option.value} className="mr-2" name="target" onChange={() => setTarget(option.value)} type="radio" />
                <span className="font-bold">{option.label}</span>
                <span className="mt-1 block text-sm text-[#4a4a4a]">{option.help}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <p className="rounded-xl bg-[#f1f7ff] p-3 text-sm leading-6 text-[#2d527d]">
          <span className="font-bold">Privacy:</span> Your project files stay on this computer. If you configure an LLM or TTS provider, the source text, script, or narration for that step is sent to that provider to create the requested draft or audio.
        </p>
        {error && <p className="rounded-xl bg-[#fff3f3] p-3 font-semibold text-[#a82727]">{error}</p>}
        <button className="rounded-full bg-[#171717] px-6 py-3 font-bold text-white disabled:opacity-60" disabled={saving} type="submit">
          {saving ? "Creating…" : "Create project"}
        </button>
      </form>
    </main>
  );
}
