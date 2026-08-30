import { auth } from "./firebase";

export async function uploadProjectImage({
  file,
  projectId,
  slot,
}: {
  file: File;
  projectId: string;
  slot: string;
}) {
  const currentUser = auth?.currentUser;
  if (!currentUser) throw new Error("You must be signed in to upload images");
  if (!file.type.startsWith("image/")) throw new Error("Only image uploads are supported");

  const formData = new FormData();
  formData.set("file", file);
  formData.set("fileName", file.name);
  formData.set("projectId", projectId);
  formData.set("slot", slot);

  const response = await fetch("/api/imagekit/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${await currentUser.getIdToken()}` },
    body: formData,
  });
  const result = (await response.json().catch(() => null)) as {
    error?: string;
    url?: string;
  } | null;
  if (!response.ok || !result?.url) {
    throw new Error(result?.error || "Unable to upload image");
  }
  return result.url;
}
