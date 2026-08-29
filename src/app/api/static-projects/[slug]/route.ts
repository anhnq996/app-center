import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const reservedSlugs = new Set(["admin", "api", "download", "assets", "_next"]);

function validSlug(slug: string) {
  return slugPattern.test(slug) && !reservedSlugs.has(slug);
}

function firebaseSettings() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!apiKey || !projectId) throw new Error("Firebase server settings are missing");
  return { apiKey, projectId };
}

async function verifyWorkspaceManager(idToken: string) {
  const { apiKey, projectId } = firebaseSettings();
  const authResponse = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      cache: "no-store",
    },
  );
  if (!authResponse.ok) throw new Error("Invalid or expired Firebase session");
  const authData = (await authResponse.json()) as { users?: { localId?: string }[] };
  const uid = authData.users?.[0]?.localId;
  if (!uid) throw new Error("Firebase user was not found");

  const profileResponse = await fetch(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/users/${encodeURIComponent(uid)}`,
    { headers: { Authorization: `Bearer ${idToken}` }, cache: "no-store" },
  );
  if (!profileResponse.ok) throw new Error("Unable to verify workspace access");
  const profile = (await profileResponse.json()) as {
    fields?: { role?: { stringValue?: string } };
  };
  if (!['owner', 'editor'].includes(profile.fields?.role?.stringValue ?? "")) {
    throw new Error("Administrator access is required");
  }
  return { projectId };
}

async function slugBelongsToAnotherProject(
  firebaseProjectId: string,
  idToken: string,
  slug: string,
  currentProjectId: string,
) {
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(firebaseProjectId)}/databases/(default)/documents:runQuery`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "projects" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "slug" },
              op: "EQUAL",
              value: { stringValue: slug },
            },
          },
        },
      }),
      cache: "no-store",
    },
  );
  if (!response.ok) throw new Error("Unable to validate slug uniqueness");
  const results = (await response.json()) as { document?: { name?: string } }[];
  return results.some((result) => {
    const documentId = result.document?.name?.split("/").pop();
    return documentId && documentId !== currentProjectId;
  });
}

function safeStaticPath(publicRoot: string, slug: string) {
  const resolved = path.resolve(publicRoot, slug);
  if (!resolved.startsWith(`${path.resolve(publicRoot)}${path.sep}`)) {
    throw new Error("Invalid static project path");
  }
  return resolved;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  if (!validSlug(slug)) {
    return NextResponse.json({ error: "Slug may contain lowercase letters, numbers, and single hyphens" }, { status: 400 });
  }

  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const projectId = request.headers.get("x-project-id")?.trim();
    if (!projectId) return NextResponse.json({ error: "Project ID is required" }, { status: 400 });

    const idToken = authorization.slice(7);
    const { projectId: firebaseProjectId } = await verifyWorkspaceManager(idToken);
    if (await slugBelongsToAnotherProject(firebaseProjectId, idToken, slug, projectId)) {
      return NextResponse.json({ error: "This slug is already used by another project" }, { status: 409 });
    }

    const archive = await JSZip.loadAsync(await request.arrayBuffer());
    const files = Object.values(archive.files).filter((entry) => !entry.dir);
    if (files.length === 0) throw new Error("The generated website archive is empty");
    const rootName = files[0].name.split("/")[0];
    const allowedPath = /^(index\.html|css\/style\.css|js\/app\.js|assets\/[a-z0-9._-]+)$/i;

    const publicRoot = path.resolve(process.cwd(), "public");
    const target = safeStaticPath(publicRoot, slug);
    const temporary = safeStaticPath(publicRoot, `.static-tmp-${slug}-${randomUUID()}`);
    await mkdir(temporary, { recursive: true });

    try {
      for (const entry of files) {
        const parts = entry.name.split("/");
        if (parts.shift() !== rootName) throw new Error("Archive contains multiple root folders");
        const relative = parts.join("/");
        if (!allowedPath.test(relative)) throw new Error(`Unexpected export path: ${relative}`);
        const destination = path.resolve(temporary, ...relative.split("/"));
        if (!destination.startsWith(`${temporary}${path.sep}`)) throw new Error("Unsafe archive path");
        await mkdir(path.dirname(destination), { recursive: true });
        await writeFile(destination, Buffer.from(await entry.async("uint8array")));
      }

      const indexPath = path.join(temporary, "index.html");
      const version = Date.now();
      const index = (await readFile(indexPath, "utf8"))
        .replace(/href="css\//g, `href="/${slug}/css/`)
        .replace(/src="js\//g, `src="/${slug}/js/`)
        .replace(/src="assets\//g, `src="/${slug}/assets/`)
        .replace(/(\/(?:css|js|assets)\/[^"']+)/g, `$1?v=${version}`);
      await writeFile(indexPath, index, "utf8");

      await rm(target, { recursive: true, force: true });
      await rename(temporary, target);
    } catch (error) {
      await rm(temporary, { recursive: true, force: true });
      throw error;
    }

    const previousSlug = request.headers.get("x-previous-slug")?.trim();
    if (previousSlug && previousSlug !== slug && validSlug(previousSlug)) {
      await rm(safeStaticPath(publicRoot, previousSlug), { recursive: true, force: true });
    }

    return NextResponse.json({ url: `/${slug}` });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to publish static project" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  if (!validSlug(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await verifyWorkspaceManager(authorization.slice(7));
    const publicRoot = path.resolve(process.cwd(), "public");
    await rm(safeStaticPath(publicRoot, slug), { recursive: true, force: true });
    const downloadRoot = path.resolve(publicRoot, "download");
    const downloadTarget = path.resolve(downloadRoot, slug);
    if (downloadTarget.startsWith(`${downloadRoot}${path.sep}`)) {
      await rm(downloadTarget, { recursive: true, force: true });
    }
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete static project" },
      { status: 500 },
    );
  }
}
