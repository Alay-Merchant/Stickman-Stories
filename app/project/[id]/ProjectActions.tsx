"use client";

import {useEffect, useState} from "react";

type Status = "created" | "scripted" | "storyboarded" | "narrated" | "rendered" | "packaged";

const endpointFor = {
  generate: "/api/generate",
  narrate: "/api/narrate",
  render: "/api/render",
  pack: "/api/pack",
} as const;

type Action = keyof typeof endpointFor;

export function ProjectActions({id, initialStatus}: {id: string; initialStatus: Status}) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [working, setWorking] = useState<Action | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!working) return;
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch("/api/projects", {cache: "no-store"});
        const data = (await response.json()) as {projects?: Array<{id: string; status: Status}>};
        const project = data.projects?.find((item) => item.id === id);
        if (project) setStatus(project.status);
      } catch {
        // The action response remains the source of any user-facing error.
      }
    }, 1500);
    return () => window.clearInterval(timer);
  }, [id, working]);

  const run = async (action: Action) => {
    setWorking(action);
    setMessage(null);
    try {
      const response = await fetch(endpointFor[action], {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({id}),
      });
      const data = (await response.json()) as {error?: string};
      if (!response.ok) throw new Error(data.error ?? "That step could not finish.");
      window.location.reload();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "That step could not finish.");
      setWorking(null);
    }
  };

  const controls: Array<{action: Action; label: string; help: string; ready: boolean}> = [
    {action: "generate", label: "1. Generate script + storyboard", help: "Creates the editable teaching draft from your source.", ready: status === "created" || status === "scripted" || status === "storyboarded"},
    {action: "narrate", label: "2. Make narration", help: "Writes one voice clip per scene and locks timing to audio.", ready: status === "storyboarded"},
    {action: "render", label: "3. Render video", help: "Creates 16:9 and 9:16 MP4s, captions, and the mixed audio track.", ready: status === "narrated"},
    {action: "pack", label: "4. Build publishing pack", help: "Ranks titles and writes description, tags, and thumbnail copy.", ready: status === "rendered" || status === "packaged"},
  ];

  return (
    <section className="rounded-2xl border-2 border-[#171717] bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Build flow</h2>
          <p className="text-sm text-[#4a4a4a]">Current status: <span className="font-bold capitalize text-[#171717]">{status}</span></p>
        </div>
        {working && <span className="rounded-full bg-[#f2c94c] px-3 py-1 text-sm font-bold">Working on {working}…</span>}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {controls.map((control) => (
          <button
            className="rounded-xl border-2 border-[#171717] p-4 text-left transition enabled:hover:border-[#2f80ed] enabled:hover:bg-[#f1f7ff] disabled:cursor-not-allowed disabled:opacity-45"
            disabled={!control.ready || Boolean(working)}
            key={control.action}
            onClick={() => run(control.action)}
            type="button"
          >
            <span className="block font-bold">{control.label}</span>
            <span className="mt-1 block text-sm text-[#4a4a4a]">{control.help}</span>
          </button>
        ))}
      </div>
      {message && <p className="mt-4 rounded-xl bg-[#fff3f3] p-3 font-semibold text-[#a82727]">{message}</p>}
    </section>
  );
}
