import { auth } from "./firebase";
import { buildProjectArchive } from "./exportProjectHtml";
import type { Project } from "./types";

export async function publishProjectStatic(project: Project, previousSlug?: string) {
  const currentUser = auth?.currentUser;
  if (!currentUser) throw new Error("You must be signed in to publish a project");
  const { archive } = await buildProjectArchive(project);
  const token = await currentUser.getIdToken();
  const response = await fetch(`/api/static-projects/${encodeURIComponent(project.slug)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/zip",
      "X-Project-Id": project.id,
      ...(previousSlug ? { "X-Previous-Slug": previousSlug } : {}),
    },
    body: archive,
  });
  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(result?.error || "Unable to publish the static website");
  }
}

export async function deleteProjectStatic(slug: string) {
  const currentUser = auth?.currentUser;
  if (!currentUser) throw new Error("You must be signed in to delete a static project");
  const token = await currentUser.getIdToken();
  const response = await fetch(`/api/static-projects/${encodeURIComponent(slug)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(result?.error || "Unable to delete static project");
  }
}
