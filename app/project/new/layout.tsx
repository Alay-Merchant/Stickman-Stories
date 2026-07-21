import type {ReactNode} from "react";

import {requireStudioPageAccess} from "@/lib/auth";

export default async function NewProjectLayout({children}: {children: ReactNode}) {
  await requireStudioPageAccess();
  return children;
}
