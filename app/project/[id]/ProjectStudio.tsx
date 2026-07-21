"use client";

import Link from "next/link";
import {useMemo, useState, type ReactNode} from "react";

import type {EditorialBrief, Pack, ProjectSettings, QaReport, Script, SourceSection, Storyboard, Target} from "@/lib/schema";

type Project = {
  id: string;
  title: string;
  author: string | null;
  input_mode: "text" | "reference_only";
  target: Target;
  status: "created" | "scripted" | "storyboarded" | "narrated" | "rendered" | "packaged";
  rights_status: "public_domain" | "licensed" | "creator_owned" | "permission_confirmed" | "commentary_review_required" | "do_not_use";
  settings: ProjectSettings;
  approvals: {source_reviewed_at: string | null; script_reviewed_at: string | null; storyboard_reviewed_at: string | null};
};

type StudioData = {
  project: Project;
  source: {text: string; sections: SourceSection[]};
  brief: EditorialBrief | null;
  script: Script | null;
  storyboard: Storyboard | null;
  pack: Pack | null;
  qa: QaReport;
  files: {video16x9: boolean; video9x16: boolean; captions: boolean; captionsVtt: boolean; thumbnail: boolean; publishingPack: boolean; shortCandidates: boolean; audio: string[]};
};

type ProjectJob = {id: string; action: "generate" | "narrate" | "render" | "pack"; status: "queued" | "running" | "completed" | "failed"; error: string | null};

const targets: Array<{value: Target; label: string}> = [
  {value: "yt_long", label: "YouTube long-form · 16:9"},
  {value: "yt_short", label: "YouTube Short · 9:16"},
  {value: "reel", label: "Instagram Reel · 9:16"},
  {value: "tiktok", label: "TikTok · 9:16"},
];

const tabs = ["Overview", "Source", "Brief", "Script", "Storyboard", "Style & voice", "QA", "Export"] as const;
type Tab = (typeof tabs)[number];

const labelForStatus = (status: Project["status"]) => status.replaceAll("_", " ");
const fileUrl = (id: string, name: string) => `/api/projects/${id}/file?name=${name}`;
const wordEstimate = (text: string) => text.trim() ? Math.ceil(text.trim().split(/\s+/).length / 140 * 60) : 0;

export function ProjectStudio({initial}: {initial: StudioData}) {
  const [tab, setTab] = useState<Tab>("Overview");
  const [data, setData] = useState(initial);
  const [working, setWorking] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [sourceDraft, setSourceDraft] = useState(initial.source.text);
  const [projectDraft, setProjectDraft] = useState({
    title: initial.project.title,
    author: initial.project.author ?? "",
    inputMode: initial.project.input_mode,
    target: initial.project.target,
    rightsStatus: initial.project.rights_status,
    settings: initial.project.settings,
  });
  const [briefDraft, setBriefDraft] = useState(initial.brief);
  const [scriptDraft, setScriptDraft] = useState(initial.script);
  const [storyboardDraft, setStoryboardDraft] = useState(initial.storyboard);

  const allNarration = useMemo(() => (scriptDraft?.sections ?? []).map((section) => section.narration).join(" "), [scriptDraft]);

  const request = async <T,>(label: string, url: string, method: string, body?: unknown): Promise<T | null> => {
    setWorking(label);
    setMessage(null);
    try {
      const response = await fetch(url, {method, headers: body === undefined ? undefined : {"Content-Type": "application/json"}, body: body === undefined ? undefined : JSON.stringify(body)});
      const responseData = (await response.json()) as T & {error?: string};
      if (!response.ok) throw new Error(responseData.error ?? "That step could not finish.");
      return responseData;
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "That step could not finish.");
      return null;
    } finally {
      setWorking(null);
    }
  };

  const reloadData = async () => {
    const next = await request<StudioData>("Refreshing", `/api/projects/${data.project.id}`, "GET");
    if (!next) return;
    setData(next);
    setSourceDraft(next.source.text);
    setProjectDraft({title: next.project.title, author: next.project.author ?? "", inputMode: next.project.input_mode, target: next.project.target, rightsStatus: next.project.rights_status, settings: next.project.settings});
    setBriefDraft(next.brief);
    setScriptDraft(next.script);
    setStoryboardDraft(next.storyboard);
  };

  const runBuild = async (action: "generate" | "narrate" | "render" | "pack") => {
    const result = await request<{job: ProjectJob}>(`Queueing ${action}`, "/api/jobs", "POST", {id: data.project.id, action});
    if (!result) return;
    setWorking(`Running ${action}`);
    setMessage(`${action[0].toUpperCase()}${action.slice(1)} is running on the persistent worker.`);
    try {
      for (let attempt = 0; attempt < 900; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 2_000));
        const response = await fetch(`/api/jobs?id=${encodeURIComponent(result.job.id)}`, {cache: "no-store"});
        const payload = await response.json() as {job?: ProjectJob; error?: string};
        if (!response.ok || !payload.job) throw new Error(payload.error ?? "The worker job could not be checked.");
        if (payload.job.status === "completed") {
          setMessage(`${action[0].toUpperCase()}${action.slice(1)} completed.`);
          await reloadData();
          return;
        }
        if (payload.job.status === "failed") throw new Error(payload.job.error ?? "The worker job failed.");
      }
      throw new Error("The worker job is still running. Refresh this page to check again.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "The worker job could not finish.");
    } finally {
      setWorking(null);
    }
  };

  const approve = async (gate: "source" | "script" | "storyboard") => {
    const result = await request("Approving", `/api/projects/${data.project.id}/approve`, "POST", {gate});
    if (result) await reloadData();
  };

  const saveSource = async () => {
    const result = await request<StudioData>("Saving source", `/api/projects/${data.project.id}`, "PATCH", {
      title: projectDraft.title,
      author: projectDraft.author,
      inputMode: projectDraft.inputMode,
      target: projectDraft.target,
      rightsStatus: projectDraft.rightsStatus,
      settings: projectDraft.settings,
      sourceText: sourceDraft,
    });
    if (result) {
      setData(result);
      setSourceDraft(result.source.text);
    }
  };

  const saveBrief = async () => {
    if (!briefDraft) return;
    const result = await request<{brief: EditorialBrief}>("Saving brief", `/api/projects/${data.project.id}/brief`, "PUT", {brief: briefDraft});
    if (result) await reloadData();
  };

  const saveScript = async () => {
    if (!scriptDraft) return;
    const result = await request<{script: Script}>("Saving script", `/api/projects/${data.project.id}/script`, "PUT", {script: scriptDraft});
    if (result) await reloadData();
  };

  const saveStoryboard = async () => {
    if (!storyboardDraft) return;
    const result = await request<{storyboard: Storyboard}>("Saving storyboard", `/api/projects/${data.project.id}/storyboard`, "PUT", {storyboard: storyboardDraft});
    if (result) await reloadData();
  };

  const runQa = async () => {
    const result = await request<{qa: QaReport}>("Running QA", `/api/projects/${data.project.id}/qa`, "POST");
    if (result) {
      setData((current) => ({...current, qa: result.qa}));
      setTab("QA");
    }
  };

  const syncPocketBase = async () => {
    const result = await request<{enabled: boolean}>("Syncing PocketBase", `/api/projects/${data.project.id}/sync`, "POST");
    if (result) setMessage(result.enabled ? "Private project snapshot synced to PocketBase." : "PocketBase is not configured for this deployment yet.");
  };

  const updateScene = (index: number, patch: Partial<NonNullable<Storyboard>["scenes"][number]>) => {
    setStoryboardDraft((current) => current ? {...current, scenes: current.scenes.map((scene, sceneIndex) => sceneIndex === index ? {...scene, ...patch} : scene)} : current);
  };

  const qaBlockers = data.qa.issues.filter((issue) => issue.severity === "blocking").length;
  const canNarrate = data.project.status === "storyboarded";
  const canRender = data.project.status === "narrated";
  const canPack = data.project.status === "rendered" || data.project.status === "packaged";

  return (
    <main className="min-h-screen bg-[#fafaf7]">
      <header className="border-b-4 border-[#171717] bg-white px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <Link className="text-sm font-bold text-[#2f80ed] hover:underline" href="/">← Projects</Link>
            <h1 className="mt-2 text-2xl font-black sm:text-3xl">{data.project.title}</h1>
            <p className="mt-1 text-sm text-[#4a4a4a]">{data.project.author || "No author"} · {targets.find((target) => target.value === data.project.target)?.label}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[#f2c94c] px-4 py-2 text-sm font-bold capitalize">{labelForStatus(data.project.status)}</span>
            <button className="rounded-full border-2 border-[#171717] px-4 py-2 text-sm font-bold hover:border-[#2f80ed]" onClick={runQa} type="button">Run QA</button>
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-10 overflow-x-auto border-b border-[#d8d8d4] bg-[#fafaf7] px-5 sm:px-8">
        <div className="mx-auto flex max-w-7xl gap-1 py-3">
          {tabs.map((item) => <button className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${tab === item ? "bg-[#171717] text-white" : "hover:bg-white"}`} key={item} onClick={() => setTab(item)} type="button">{item}</button>)}
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8">
        {message ? <p className="mb-6 rounded-xl bg-[#fff3f3] p-4 font-semibold text-[#a82727]">{message}</p> : null}

        {tab === "Overview" ? (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-3xl border-2 border-[#171717] bg-white p-6">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#2f80ed]">Creator workflow</p>
              <h2 className="mt-2 text-2xl font-black">Review before every meaningful step</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <BuildButton disabled={Boolean(working)} label="1. Generate brief + script + storyboard" onClick={() => runBuild("generate")} ready />
                <BuildButton disabled={Boolean(working) || !canNarrate} label="2. Make audio after review" onClick={() => runBuild("narrate")} ready={canNarrate} />
                <BuildButton disabled={Boolean(working) || !canRender} label="3. Render both video formats" onClick={() => runBuild("render")} ready={canRender} />
                <BuildButton disabled={Boolean(working) || !canPack} label="4. Build publishing package" onClick={() => runBuild("pack")} ready={canPack} />
              </div>
              {working ? <p className="mt-4 rounded-xl bg-[#f1f7ff] p-3 text-sm font-bold">Working on {working}…</p> : null}
            </section>
            <section className="rounded-3xl border-2 border-[#171717] bg-[#171717] p-6 text-white">
              <h2 className="text-xl font-black">Review gates</h2>
              <ReviewGate approved={data.project.approvals.source_reviewed_at} label="Rights + source checked" onApprove={() => approve("source")} />
              <ReviewGate approved={data.project.approvals.script_reviewed_at} label="Script approved" onApprove={() => approve("script")} />
              <ReviewGate approved={data.project.approvals.storyboard_reviewed_at} label="Storyboard approved" onApprove={() => approve("storyboard")} />
              <p className="mt-5 rounded-xl bg-white/10 p-3 text-sm">{qaBlockers ? `${qaBlockers} blocking QA issue${qaBlockers === 1 ? "" : "s"} remain.` : "No blocking QA issue is currently recorded."}</p>
            </section>
            <section className="rounded-3xl border-2 border-[#171717] bg-white p-6 lg:col-span-2">
              <h2 className="text-xl font-black">Source map</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{data.source.sections.map((section) => <article className="rounded-xl border border-[#d8d8d4] p-4" key={section.id}><p className="font-bold">{section.heading}</p><p className="mt-2 text-sm leading-6 text-[#4a4a4a]">{section.excerpt}</p><code className="mt-3 block text-xs text-[#2f80ed]">{section.id}</code></article>)}</div>
            </section>
          </div>
        ) : null}

        {tab === "Source" ? (
          <section className="rounded-3xl border-2 border-[#171717] bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-2xl font-black">Source, permissions, and brief settings</h2><p className="mt-1 text-sm text-[#4a4a4a]">Updating these fields resets downstream approvals so the draft stays reviewable.</p></div><button className="rounded-full bg-[#171717] px-5 py-3 font-bold text-white disabled:opacity-60" disabled={Boolean(working)} onClick={saveSource} type="button">Save source settings</button></div>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="Project title"><input className="studio-input" onChange={(event) => setProjectDraft((current) => ({...current, title: event.target.value}))} value={projectDraft.title} /></Field>
              <Field label="Author"><input className="studio-input" onChange={(event) => setProjectDraft((current) => ({...current, author: event.target.value}))} value={projectDraft.author} /></Field>
              <Field label="Target"><select className="studio-input" onChange={(event) => setProjectDraft((current) => ({...current, target: event.target.value as Target}))} value={projectDraft.target}>{targets.map((target) => <option key={target.value} value={target.value}>{target.label}</option>)}</select></Field>
              <Field label="Rights status"><select className="studio-input" onChange={(event) => setProjectDraft((current) => ({...current, rightsStatus: event.target.value as Project["rights_status"]}))} value={projectDraft.rightsStatus}><option value="creator_owned">Creator owned</option><option value="public_domain">Public domain</option><option value="licensed">Licensed</option><option value="permission_confirmed">Permission confirmed</option><option value="commentary_review_required">Commentary review required</option><option value="do_not_use">Do not use</option></select></Field>
              <Field label="Audience"><input className="studio-input" onChange={(event) => setProjectDraft((current) => ({...current, settings: {...current.settings, audience: event.target.value}}))} value={projectDraft.settings.audience} /></Field>
              <Field label="Target duration (seconds)"><input className="studio-input" max="600" min="20" onChange={(event) => setProjectDraft((current) => ({...current, settings: {...current.settings, duration_seconds: Number(event.target.value) || 20}}))} type="number" value={projectDraft.settings.duration_seconds} /></Field>
            </div>
            <div className="mt-6 flex flex-wrap gap-4"><label className="flex items-center gap-2 rounded-xl border-2 border-[#171717] px-4 py-3 text-sm font-bold"><input checked={projectDraft.inputMode === "text"} onChange={() => setProjectDraft((current) => ({...current, inputMode: "text"}))} type="radio" /> Approved source text</label><label className="flex items-center gap-2 rounded-xl border-2 border-[#171717] px-4 py-3 text-sm font-bold"><input checked={projectDraft.inputMode === "reference_only"} onChange={() => setProjectDraft((current) => ({...current, inputMode: "reference_only"}))} type="radio" /> Reference-only</label></div>
            {projectDraft.inputMode === "text" ? <Field label="Approved source notes"><textarea className="studio-input mt-2 min-h-80 font-mono text-sm" onChange={(event) => setSourceDraft(event.target.value)} value={sourceDraft} /></Field> : <p className="mt-6 rounded-xl bg-[#fff8d9] p-4 text-sm leading-6">Reference-only mode never treats model memory as proof. Verify every factual claim against public sources before publishing.</p>}
          </section>
        ) : null}

        {tab === "Brief" ? (
          <section className="rounded-3xl border-2 border-[#171717] bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-2xl font-black">Editorial brief</h2><p className="mt-1 text-sm text-[#4a4a4a]">The angle and learning objective steer every generated scene.</p></div><button className="rounded-full bg-[#171717] px-5 py-3 font-bold text-white disabled:opacity-60" disabled={!briefDraft || Boolean(working)} onClick={saveBrief} type="button">Save brief</button></div>
            {briefDraft ? <div className="mt-6 grid gap-5 md:grid-cols-2"><Field label="Objective"><textarea className="studio-input min-h-28" onChange={(event) => setBriefDraft((current) => current ? {...current, objective: event.target.value} : current)} value={briefDraft.objective} /></Field><Field label="Audience"><textarea className="studio-input min-h-28" onChange={(event) => setBriefDraft((current) => current ? {...current, audience: event.target.value} : current)} value={briefDraft.audience} /></Field><Field label="Angle"><textarea className="studio-input min-h-28" onChange={(event) => setBriefDraft((current) => current ? {...current, angle: event.target.value} : current)} value={briefDraft.angle} /></Field><Field label="Call to action"><textarea className="studio-input min-h-28" onChange={(event) => setBriefDraft((current) => current ? {...current, cta: event.target.value} : current)} value={briefDraft.cta} /></Field><Field label="Key ideas (one per line)"><textarea className="studio-input min-h-36" onChange={(event) => setBriefDraft((current) => current ? {...current, key_ideas: event.target.value.split("\n").map((value) => value.trim()).filter(Boolean)} : current)} value={briefDraft.key_ideas.join("\n")} /></Field><Field label="Caveats (one per line)"><textarea className="studio-input min-h-36" onChange={(event) => setBriefDraft((current) => current ? {...current, caveats: event.target.value.split("\n").map((value) => value.trim()).filter(Boolean)} : current)} value={briefDraft.caveats.join("\n")} /></Field></div> : <EmptyState text="Generate the first editorial draft to populate this screen." />}
          </section>
        ) : null}

        {tab === "Script" ? (
          <section className="rounded-3xl border-2 border-[#171717] bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-2xl font-black">Editable teaching script</h2><p className="mt-1 text-sm text-[#4a4a4a]">About {wordEstimate(allNarration)} seconds at 140 words per minute. Saving requires a fresh review.</p></div><div className="flex gap-3"><button className="rounded-full border-2 border-[#171717] px-5 py-3 font-bold" disabled={Boolean(working)} onClick={() => approve("script")} type="button">Approve reviewed script</button><button className="rounded-full bg-[#171717] px-5 py-3 font-bold text-white disabled:opacity-60" disabled={!scriptDraft || Boolean(working)} onClick={saveScript} type="button">Save script</button></div></div>
            {scriptDraft ? <div className="mt-6 space-y-4">{scriptDraft.sections.map((section, index) => <article className="rounded-2xl border-2 border-[#d8d8d4] p-4" key={index}><div className="grid gap-4 md:grid-cols-[160px_1fr]"><Field label="Teaching job"><select className="studio-input" onChange={(event) => setScriptDraft((current) => current ? {...current, sections: current.sections.map((item, itemIndex) => itemIndex === index ? {...item, purpose: event.target.value as typeof item.purpose} : item)} : current)} value={section.purpose}>{["hook", "explain", "contrast", "demonstrate", "recap", "transition"].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label={`Section ${index + 1} narration`}><textarea className="studio-input min-h-28" onChange={(event) => setScriptDraft((current) => current ? {...current, sections: current.sections.map((item, itemIndex) => itemIndex === index ? {...item, narration: event.target.value} : item)} : current)} value={section.narration} /></Field></div><div className="mt-3 grid gap-4 md:grid-cols-2"><Field label="Claim kind"><select className="studio-input" onChange={(event) => setScriptDraft((current) => current ? {...current, sections: current.sections.map((item, itemIndex) => itemIndex === index ? {...item, claim_kind: event.target.value as typeof item.claim_kind} : item)} : current)} value={section.claim_kind}>{["fact", "interpretation", "general_advice", "creative_example"].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Source references"><input className="studio-input" onChange={(event) => setScriptDraft((current) => current ? {...current, sections: current.sections.map((item, itemIndex) => itemIndex === index ? {...item, source_refs: event.target.value.split(",").map((value) => value.trim()).filter(Boolean)} : item)} : current)} value={section.source_refs.join(", ")} /></Field></div></article>)}</div> : <EmptyState text="Generate the first script to edit its sections and source support." />}
          </section>
        ) : null}

        {tab === "Storyboard" ? (
          <section className="rounded-3xl border-2 border-[#171717] bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-2xl font-black">Storyboard and scene timeline</h2><p className="mt-1 text-sm text-[#4a4a4a]">Every scene is editable. Saving or making narration resets the storyboard approval gate.</p></div><div className="flex gap-3"><button className="rounded-full border-2 border-[#171717] px-5 py-3 font-bold" disabled={Boolean(working)} onClick={() => approve("storyboard")} type="button">Approve all reviewed scenes</button><button className="rounded-full bg-[#171717] px-5 py-3 font-bold text-white disabled:opacity-60" disabled={!storyboardDraft || Boolean(working)} onClick={saveStoryboard} type="button">Save storyboard</button></div></div>
            {storyboardDraft ? <div className="mt-6 space-y-5">{storyboardDraft.scenes.map((scene, index) => <article className="rounded-2xl border-2 border-[#d8d8d4] p-5" key={scene.scene_id}><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-lg font-black">Scene {scene.scene_id}</h3><span className="rounded-full bg-[#f1f7ff] px-3 py-1 text-sm font-bold">{scene.duration_seconds.toFixed(1)} s</span></div><div className="mt-4 grid gap-4 lg:grid-cols-2"><Field label="Narration"><textarea className="studio-input min-h-28" onChange={(event) => updateScene(index, {narration: event.target.value})} value={scene.narration} /></Field><Field label="On-screen teaching phrase"><textarea className="studio-input min-h-28" maxLength={60} onChange={(event) => updateScene(index, {on_screen_text: event.target.value})} value={scene.on_screen_text} /></Field><Field label="Action"><input className="studio-input" onChange={(event) => updateScene(index, {action: event.target.value})} value={scene.action} /></Field><Field label="Alt-style description"><input className="studio-input" onChange={(event) => updateScene(index, {alt_description: event.target.value})} value={scene.alt_description} /></Field></div><div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Field label="Duration"><input className="studio-input" max="12" min="1" onChange={(event) => updateScene(index, {duration_seconds: Number(event.target.value) || 1})} step="0.1" type="number" value={scene.duration_seconds} /></Field><Field label="Purpose"><select className="studio-input" onChange={(event) => updateScene(index, {purpose: event.target.value as typeof scene.purpose})} value={scene.purpose}>{["hook", "explain", "contrast", "demonstrate", "recap", "transition"].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Accent"><select className="studio-input" onChange={(event) => updateScene(index, {accent: event.target.value as typeof scene.accent})} value={scene.accent}>{["none", "blue", "green", "red", "yellow"].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Camera"><select className="studio-input" onChange={(event) => updateScene(index, {camera: event.target.value as typeof scene.camera})} value={scene.camera}>{["static", "slow_push_in", "slow_pull_back", "pan_left", "pan_right"].map((value) => <option key={value}>{value}</option>)}</select></Field></div><div className="mt-4 grid gap-4 md:grid-cols-3"><Field label="Character ids"><input className="studio-input" onChange={(event) => updateScene(index, {characters: event.target.value.split(",").map((value) => value.trim()).filter(Boolean)})} value={scene.characters.join(", ")} /></Field><Field label="Prop ids"><input className="studio-input" onChange={(event) => updateScene(index, {props: event.target.value.split(",").map((value) => value.trim()).filter(Boolean)})} value={scene.props.join(", ")} /></Field><Field label="Background id"><select className="studio-input" onChange={(event) => updateScene(index, {background: event.target.value})} value={scene.background}>{["blank_board", "desk", "outdoor"].map((value) => <option key={value}>{value}</option>)}</select></Field></div><div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Claim kind"><select className="studio-input" onChange={(event) => updateScene(index, {claim_kind: event.target.value as typeof scene.claim_kind})} value={scene.claim_kind}>{["fact", "interpretation", "general_advice", "creative_example"].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Source refs"><input className="studio-input" onChange={(event) => updateScene(index, {source_refs: event.target.value.split(",").map((value) => value.trim()).filter(Boolean)})} value={scene.source_refs.join(", ")} /></Field></div><SceneSketch scene={scene} /></article>)}</div> : <EmptyState text="Generate the storyboard before editing scene cards." />}
          </section>
        ) : null}

        {tab === "Style & voice" ? (
          <section className="rounded-3xl border-2 border-[#171717] bg-white p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-2xl font-black">Style, audio, and licences</h2><p className="mt-1 text-sm text-[#4a4a4a]">The renderer stays locked to whiteboard_v1; use these notes to guide your approvals and provider setup.</p></div><button className="rounded-full bg-[#171717] px-5 py-3 font-bold text-white" disabled={Boolean(working)} onClick={saveSource} type="button">Save settings</button></div><div className="mt-6 grid gap-5 md:grid-cols-2"><Field label="Tone"><select className="studio-input" onChange={(event) => setProjectDraft((current) => ({...current, settings: {...current.settings, tone: event.target.value as ProjectSettings["tone"]}}))} value={projectDraft.settings.tone}>{["curious", "calm", "playful", "direct", "serious"].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Spoiler policy"><select className="studio-input" onChange={(event) => setProjectDraft((current) => ({...current, settings: {...current.settings, spoiler_policy: event.target.value as ProjectSettings["spoiler_policy"]}}))} value={projectDraft.settings.spoiler_policy}>{["none", "premise_only", "partial", "full"].map((value) => <option key={value}>{value.replaceAll("_", " ")}</option>)}</select></Field><Field label="Voice direction"><textarea className="studio-input min-h-32" onChange={(event) => setProjectDraft((current) => ({...current, settings: {...current.settings, voice_notes: event.target.value}}))} value={projectDraft.settings.voice_notes} /></Field><Field label="Pronunciation notes"><textarea className="studio-input min-h-32" onChange={(event) => setProjectDraft((current) => ({...current, settings: {...current.settings, pronunciation_notes: event.target.value}}))} value={projectDraft.settings.pronunciation_notes} /></Field><Field label="Music licence / provenance"><textarea className="studio-input min-h-32" onChange={(event) => setProjectDraft((current) => ({...current, settings: {...current.settings, music_license_note: event.target.value}}))} value={projectDraft.settings.music_license_note} /></Field><Field label="Required ideas (one per line)"><textarea className="studio-input min-h-32" onChange={(event) => setProjectDraft((current) => ({...current, settings: {...current.settings, required_ideas: event.target.value.split("\n").map((value) => value.trim()).filter(Boolean)}}))} value={projectDraft.settings.required_ideas.join("\n")} /></Field></div><div className="mt-6 rounded-2xl bg-[#f1f7ff] p-5 text-sm leading-6"><p className="font-bold">Approved whiteboard vocabulary</p><p className="mt-2">Character: learner. Backgrounds: blank_board, desk, outdoor. Props: book, phone, arrow, checkbox, lightbulb, graph, coin, clock, brain, ladder. QA blocks unsupported asset ids.</p></div></section>
        ) : null}

        {tab === "QA" ? (
          <section className="rounded-3xl border-2 border-[#171717] bg-white p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-2xl font-black">Pre-render quality checks</h2><p className="mt-1 text-sm text-[#4a4a4a]">Run this again after any review or edit. Blocking issues prevent audio and video rendering.</p></div><button className="rounded-full bg-[#171717] px-5 py-3 font-bold text-white" disabled={Boolean(working)} onClick={runQa} type="button">Run QA now</button></div><div className="mt-6 grid gap-3">{data.qa.issues.length ? data.qa.issues.map((issue) => <article className={`rounded-2xl border-2 p-4 ${issue.severity === "blocking" ? "border-[#eb5757] bg-[#fff3f3]" : issue.severity === "warning" ? "border-[#f2c94c] bg-[#fff8d9]" : "border-[#2f80ed] bg-[#f1f7ff]"}`} key={issue.id}><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-black capitalize">{issue.severity} · {issue.area}</p>{issue.scene_id ? <span className="text-sm font-bold">Scene {issue.scene_id}</span> : null}</div><p className="mt-2 text-sm leading-6">{issue.message}</p></article>) : <EmptyState text="No issues found. Keep reviewing before publishing." />}</div></section>
        ) : null}

        {tab === "Export" ? (
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]"><section className="rounded-3xl border-2 border-[#171717] bg-white p-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-black">Ready files</h2><button className="rounded-full border-2 border-[#171717] px-4 py-2 text-sm font-bold" disabled={Boolean(working)} onClick={syncPocketBase} type="button">Sync PocketBase</button></div><p className="mt-3 text-sm text-[#4a4a4a]">Syncs the private source and structured project snapshot. Render files stay with the worker or protected object storage.</p><div className="mt-5 grid gap-3"><DownloadLink available={data.files.video16x9} href={fileUrl(data.project.id, "16x9")} label="Download 16:9 MP4" /><DownloadLink available={data.files.video9x16} href={fileUrl(data.project.id, "9x16")} label="Download 9:16 MP4" /><DownloadLink available={data.files.captions} href={fileUrl(data.project.id, "captions")} label="Download captions (.srt)" /><DownloadLink available={data.files.captionsVtt} href={fileUrl(data.project.id, "vtt")} label="Download captions (.vtt)" /><DownloadLink available={data.files.thumbnail} href={fileUrl(data.project.id, "thumbnail")} label="Download thumbnail SVG" /><DownloadLink available={data.files.publishingPack} href={fileUrl(data.project.id, "pack")} label="Download publishing pack" /><DownloadLink available={data.files.shortCandidates} href={fileUrl(data.project.id, "shorts")} label="Download short candidates" /></div></section><section className="rounded-3xl border-2 border-[#171717] bg-white p-6"><h2 className="text-2xl font-black">Publishing package</h2>{data.pack ? <><ol className="mt-5 list-decimal space-y-2 pl-5 font-bold">{data.pack.titles.map((title) => <li key={title.text}>{title.text}</li>)}</ol><p className="mt-5 rounded-xl bg-[#f1f7ff] p-4 text-sm leading-6">{data.pack.description}</p><p className="mt-4 text-sm"><span className="font-bold">Tags:</span> {data.pack.tags.join(", ")}</p><div className="mt-5"><p className="font-bold">Short-form candidates</p><ul className="mt-2 space-y-2 text-sm">{data.pack.short_candidates.map((candidate) => <li className="rounded-lg bg-[#fff8d9] p-3" key={candidate.label}><strong>{candidate.label}</strong> · scenes {candidate.scene_ids.join(", ")}<br />{candidate.rationale}</li>)}</ul></div></> : <EmptyState text="Render, then generate the publishing package to create titles, copy, thumbnail text, chapters, and derivative ideas." />}</section></div>
        ) : null}
      </div>
    </main>
  );
}

function Field({children, label}: {children: ReactNode; label: string}) {
  return <label className="mt-5 block text-sm font-bold"><span>{label}</span><div className="mt-2">{children}</div></label>;
}

function BuildButton({disabled, label, onClick, ready}: {disabled: boolean; label: string; onClick: () => void; ready: boolean}) {
  return <button className="rounded-2xl border-2 border-[#171717] p-4 text-left font-bold transition enabled:hover:border-[#2f80ed] enabled:hover:bg-[#f1f7ff] disabled:cursor-not-allowed disabled:opacity-45" disabled={disabled} onClick={onClick} type="button"><span className="block">{label}</span><span className="mt-2 block text-xs font-medium text-[#4a4a4a]">{ready ? "Ready when review gates are clear" : "Complete the prior stage first"}</span></button>;
}

function ReviewGate({approved, label, onApprove}: {approved: string | null; label: string; onApprove: () => void}) {
  return <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-white/10 p-3"><span className="text-sm font-bold">{label}</span>{approved ? <span className="rounded-full bg-[#27ae60] px-3 py-1 text-xs font-bold">Approved</span> : <button className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#171717]" onClick={onApprove} type="button">Mark reviewed</button>}</div>;
}

function SceneSketch({scene}: {scene: NonNullable<Storyboard>["scenes"][number]}) {
  const accent = {blue: "#2f80ed", green: "#27ae60", red: "#eb5757", yellow: "#f2c94c", none: "#171717"}[scene.accent];
  return <div className="mt-5 grid min-h-40 place-items-center overflow-hidden rounded-xl border-2 border-dashed border-[#d8d8d4] bg-[#fafaf7] p-5"><div className="flex items-center gap-4"><div className="relative h-20 w-14"><span className="absolute left-4 top-0 h-8 w-8 rounded-full border-[3px] border-[#171717]" /><span className="absolute left-7 top-8 h-8 border-l-[3px] border-[#171717]" /><span className="absolute left-0 top-[42px] h-[3px] w-14 bg-[#171717]" /><span className="absolute left-1 top-[72px] h-9 w-[3px] rotate-[25deg] bg-[#171717]" /><span className="absolute right-1 top-[72px] h-9 w-[3px] -rotate-[25deg] bg-[#171717]" /></div><div><p className="text-sm font-black" style={{color: accent}}>{scene.on_screen_text || "Scene preview"}</p><p className="mt-1 max-w-md text-xs text-[#4a4a4a]">{scene.action} · {scene.background}</p></div></div></div>;
}

function DownloadLink({available, href, label}: {available: boolean; href: string; label: string}) {
  return available ? <a className="rounded-xl bg-[#eefaf2] p-4 font-bold hover:bg-[#d7f3df]" href={href}>{label}</a> : <span className="rounded-xl border border-dashed border-[#d8d8d4] p-4 text-sm text-[#4a4a4a]">{label} · not ready</span>;
}

function EmptyState({text}: {text: string}) {
  return <p className="mt-6 rounded-xl bg-[#f1f7ff] p-4 text-sm leading-6 text-[#2d527d]">{text}</p>;
}
