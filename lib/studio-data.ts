import {fetchFromRenderWorker} from "./worker-proxy";
import {listProjects, projectArtifacts} from "./workflow";

type ProjectListResponse = {projects: ReturnType<typeof listProjects>};
type ProjectArtifacts = ReturnType<typeof projectArtifacts>;

export const loadStudioProjects = async () => {
  const remote = await fetchFromRenderWorker<ProjectListResponse>("/api/projects");
  return remote?.projects ?? listProjects();
};

export const loadStudioProject = async (id: string) => {
  const remote = await fetchFromRenderWorker<ProjectArtifacts>(`/api/projects/${encodeURIComponent(id)}`);
  return remote ?? projectArtifacts(id);
};
