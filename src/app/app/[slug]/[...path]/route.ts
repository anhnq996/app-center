import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const contentTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ipa": "application/octet-stream",
  ".js": "text/javascript; charset=utf-8",
  ".plist": "application/xml; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

function validSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function safeAssetPath(slug: string, parts: string[]) {
  const staticRoot = path.resolve(process.cwd(), "public", "app");
  const filePath = path.resolve(staticRoot, slug, ...parts);
  if (!filePath.startsWith(`${path.resolve(staticRoot, slug)}${path.sep}`)) {
    throw new Error("Invalid asset path");
  }
  return filePath;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string; path: string[] }> },
) {
  const { slug, path: parts } = await context.params;
  if (!validSlug(slug) || parts.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const filePath = safeAssetPath(slug, parts);
    const body = await readFile(filePath);
    const etag = `"${createHash("sha256").update(body).digest("base64url")}"`;
    const cacheControl = "public, max-age=31536000, immutable";
    if (request.headers.get("if-none-match") === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: { ETag: etag, "Cache-Control": cacheControl },
      });
    }
    return new NextResponse(body, {
      headers: {
        "Cache-Control": cacheControl,
        "Content-Type": contentTypes[path.extname(filePath).toLowerCase()] ?? "application/octet-stream",
        ETag: etag,
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
