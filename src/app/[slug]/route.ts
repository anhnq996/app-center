import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return new NextResponse("Not found", { status: 404 });
  }
  try {
    const publicRoot = path.resolve(process.cwd(), "public");
    const staticRoot = path.resolve(publicRoot, "app");
    const filePath = path.resolve(staticRoot, slug, "index.html");
    if (!filePath.startsWith(`${staticRoot}${path.sep}`)) {
      return new NextResponse("Not found", { status: 404 });
    }
    const html = await readFile(filePath, "utf8");
    const etag = `"${createHash("sha256").update(html).digest("base64url")}"`;
    const cacheControl = "public, max-age=0, must-revalidate, s-maxage=300, stale-while-revalidate=60";
    if (request.headers.get("if-none-match") === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: { ETag: etag, "Cache-Control": cacheControl },
      });
    }
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": cacheControl,
        ETag: etag,
      },
    });
  } catch {
    return new NextResponse("Không tìm thấy trang", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
