import { NextResponse } from "next/server";

export const runtime = "nodejs";

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

function safePathSegment(value: string) {
  return value.replace(/[^a-z0-9._-]+/gi, "-").replace(/^[.-]+/, "") || "file";
}

function imageKitSettings() {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) throw new Error("IMAGEKIT_PRIVATE_KEY is missing");
  return { privateKey };
}

function imageKitAuthHeader(privateKey: string) {
  return `Basic ${Buffer.from(`${privateKey}:`).toString("base64")}`;
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await verifyWorkspaceManager(authorization.slice(7));

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("An image file is required");
    if (!file.type.startsWith("image/")) throw new Error("Only image uploads are supported");

    const projectId = safePathSegment(String(form.get("projectId") ?? "project"));
    const slot = safePathSegment(String(form.get("slot") ?? "logo"));
    const fileName = safePathSegment(String(form.get("fileName") ?? file.name));
    const { privateKey } = imageKitSettings();

    const uploadForm = new FormData();
    uploadForm.set("file", file);
    uploadForm.set("fileName", fileName);
    uploadForm.set("folder", `/app-center/projects/${projectId}/images`);
    uploadForm.set("useUniqueFileName", "false");
    uploadForm.set("overwriteFile", "true");
    uploadForm.set("customCoordinates", "");
    uploadForm.set("tags", `app-center,project-${projectId},${slot}`);

    const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
      method: "POST",
      headers: { Authorization: imageKitAuthHeader(privateKey) },
      body: uploadForm,
    });
    const result = (await response.json().catch(() => null)) as {
      error?: { message?: string };
      message?: string;
      url?: string;
      fileId?: string;
      name?: string;
      filePath?: string;
    } | null;

    if (!response.ok || !result?.url) {
      throw new Error(result?.error?.message || result?.message || "Unable to upload image to ImageKit");
    }

    return NextResponse.json({
      url: result.url,
      fileId: result.fileId,
      name: result.name,
      filePath: result.filePath,
    });
  } catch (error) {
    console.error("ImageKit upload failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to upload image" },
      { status: 500 },
    );
  }
}
