import {randomUUID} from "node:crypto";
import {existsSync, readdirSync} from "node:fs";
import {mkdirSync} from "node:fs";
import path from "node:path";

import {getDataDirectory} from "./db";
import {readJsonFile, writeJsonFile} from "./project";
import {generateProject, narrateProject, packageProject, renderProject} from "./workflow";

export const PROJECT_JOB_ACTIONS = ["generate", "narrate", "render", "pack"] as const;
export type ProjectJobAction = (typeof PROJECT_JOB_ACTIONS)[number];
export type ProjectJobStatus = "queued" | "running" | "completed" | "failed";

export type ProjectJob = {
  id: string;
  project_id: string;
  action: ProjectJobAction;
  status: ProjectJobStatus;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error: string | null;
};

const activeJobs = new Map<string, Promise<void>>();
const jobIdPattern = /^[A-Za-z0-9-]{1,128}$/;
const jobsDirectory = () => path.join(getDataDirectory(), "jobs");
const jobPath = (id: string) => {
  if (!jobIdPattern.test(id)) throw new Error("Invalid job id.");
  return path.join(jobsDirectory(), `${id}.json`);
};
const writeJob = (job: ProjectJob) => {
  mkdirSync(jobsDirectory(), {recursive: true});
  writeJsonFile(jobPath(job.id), job);
  return job;
};
const readJob = (id: string): ProjectJob => {
  const filePath = jobPath(id);
  if (!existsSync(filePath)) throw new Error("Job not found.");
  return readJsonFile<ProjectJob>(filePath);
};

const activeJobForProject = (projectId: string) => {
  if (activeJobs.has(projectId)) return true;
  if (!existsSync(jobsDirectory())) return false;
  return readdirSync(jobsDirectory())
    .filter((name) => name.endsWith(".json"))
    .some((name) => {
      try {
        const job = readJsonFile<ProjectJob>(path.join(jobsDirectory(), name));
        return job.project_id === projectId && (job.status === "queued" || job.status === "running");
      } catch {
        return false;
      }
    });
};

const publicError = (error: unknown) => error instanceof Error ? error.message.slice(0, 500) : "The worker job could not finish.";

const run = async (job: ProjectJob) => {
  let current = writeJob({...job, status: "running", started_at: new Date().toISOString()});
  try {
    if (current.action === "generate") await generateProject(current.project_id);
    if (current.action === "narrate") await narrateProject(current.project_id);
    if (current.action === "render") await renderProject(current.project_id);
    if (current.action === "pack") await packageProject(current.project_id);
    current = writeJob({...current, status: "completed", completed_at: new Date().toISOString()});
  } catch (error) {
    writeJob({...current, status: "failed", completed_at: new Date().toISOString(), error: publicError(error)});
  } finally {
    activeJobs.delete(current.project_id);
  }
};

export const enqueueProjectJob = (projectId: string, action: ProjectJobAction): ProjectJob => {
  if (activeJobForProject(projectId)) throw new Error("This project already has a job running. Wait for it to finish before starting another step.");
  const job: ProjectJob = {
    id: randomUUID(),
    project_id: projectId,
    action,
    status: "queued",
    created_at: new Date().toISOString(),
    started_at: null,
    completed_at: null,
    error: null,
  };
  writeJob(job);
  const task = run(job);
  activeJobs.set(projectId, task);
  void task;
  return job;
};

export const getProjectJob = (id: string): ProjectJob => {
  const job = readJob(id);
  // A process restart cannot resume in-memory Chromium/FFmpeg work. Surface
  // the state truthfully instead of leaving the editor polling forever.
  if (job.status === "running" && !activeJobs.has(job.project_id)) {
    return writeJob({...job, status: "failed", completed_at: new Date().toISOString(), error: "The worker restarted before this job completed. Start the step again."});
  }
  return job;
};
