import {notFound} from "next/navigation";

import {ProjectStudio} from "./ProjectStudio";
import {requireStudioPageAccess} from "@/lib/auth";
import {loadStudioProject} from "@/lib/studio-data";

export const dynamic = "force-dynamic";

export default async function ProjectPage({params}: {params: Promise<{id: string}>}) {
  await requireStudioPageAccess();
  const {id} = await params;
  try {
    const data = await loadStudioProject(id);
    const {dir: _dir, ...project} = data.project;
    return <ProjectStudio initial={{...data, project}} />;
  } catch {
    notFound();
  }
}
