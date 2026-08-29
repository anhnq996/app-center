import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const reservedSlugs = new Set(["admin", "api", "download", "assets", "_next"]);

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
  if (!["owner", "editor"].includes(profile.fields?.role?.stringValue ?? "")) {
    throw new Error("Administrator access is required");
  }
}

function safeName(name: string) {
  return name.replace(/[^a-z0-9._-]+/gi, "-").replace(/^[.-]+/, "") || "file.bin";
}

function safeDownloadDirectory(slug: string) {
  const downloadRoot = path.resolve(process.cwd(), "public", "download");
  const directory = path.resolve(downloadRoot, slug);
  if (!directory.startsWith(`${downloadRoot}${path.sep}`)) throw new Error("Invalid upload path");
  return directory;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function updateManifestIpaUrl(source: string, ipaUrl: string) {
  const softwarePackageUrl =
    /(<key>\s*kind\s*<\/key>\s*<string>\s*software-package\s*<\/string>[\s\S]*?<key>\s*url\s*<\/key>\s*<string>)[\s\S]*?(<\/string>)/i;
  if (!softwarePackageUrl.test(source)) {
    throw new Error("The plist does not contain a software-package URL");
  }
  return source.replace(softwarePackageUrl, `$1${escapeXml(ipaUrl)}$2`);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  if (!slugPattern.test(slug) || reservedSlugs.has(slug)) {
    return NextResponse.json({ error: "Save a valid project slug before uploading" }, { status: 400 });
  }
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await verifyWorkspaceManager(authorization.slice(7));
    const form = await request.formData();
    const mode = String(form.get("mode") ?? "");
    const platformId = safeName(String(form.get("platformId") ?? "platform"));
    const directory = safeDownloadDirectory(slug);
    await mkdir(directory, { recursive: true });
    const stamp = Date.now();

    if (mode === "direct") {
      const file = form.get("file");
      if (!(file instanceof File)) throw new Error("A file is required");
      const storedName = `${platformId}-${stamp}-${safeName(file.name)}`;
      await writeFile(path.join(directory, storedName), Buffer.from(await file.arrayBuffer()));
      return NextResponse.json({
        url: `/download/${slug}/${storedName}`,
        fileName: file.name,
        fileSize: formatFileSize(file.size),
      });
    }

    if (mode === "ios") {
      const ipa = form.get("ipa");
      const plist = form.get("plist");
      if (!(ipa instanceof File) || !ipa.name.toLowerCase().endsWith(".ipa")) {
        throw new Error("A valid IPA file is required");
      }
      if (!(plist instanceof File) || !plist.name.toLowerCase().endsWith(".plist")) {
        throw new Error("A valid plist file is required");
      }
      const ipaStoredName = `${platformId}-${stamp}-${safeName(ipa.name)}`;
      const plistStoredName = `${platformId}-${stamp}-${safeName(plist.name)}`;
      const rewriteManifestUrl = String(form.get("rewriteManifestUrl") ?? "true") !== "false";
      const forwardedHost = request.headers.get("x-forwarded-host");
      const forwardedProtocol = request.headers.get("x-forwarded-proto");
      const origin =
        forwardedHost && forwardedProtocol
          ? `${forwardedProtocol.split(",")[0]}://${forwardedHost.split(",")[0]}`
          : new URL(request.url).origin;
      const ipaUrl = `${origin}/download/${slug}/${ipaStoredName}`;
      const manifestUrl = `${origin}/download/${slug}/${plistStoredName}`;
      const originalManifest = await plist.text();
      const manifest = rewriteManifestUrl
        ? updateManifestIpaUrl(originalManifest, ipaUrl)
        : originalManifest;
      await Promise.all([
        writeFile(path.join(directory, ipaStoredName), Buffer.from(await ipa.arrayBuffer())),
        writeFile(path.join(directory, plistStoredName), manifest, "utf8"),
      ]);
      return NextResponse.json({
        url: manifestUrl,
        ipaUrl,
        fileName: ipa.name,
        fileSize: formatFileSize(ipa.size),
        manifestFileName: plist.name,
        manifestRewritten: rewriteManifestUrl,
      });
    }

    throw new Error("Unsupported upload mode");
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to upload file" },
      { status: 500 },
    );
  }
}
