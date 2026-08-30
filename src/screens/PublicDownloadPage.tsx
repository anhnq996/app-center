"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useStore } from "../lib/store";
import { backgroundStyle, isLightText } from "../lib/appearance";
import { DownloadCard } from "../components/DownloadCard";

function detectPlatform(): "android" | "ios" | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  return null;
}

export default function PublicDownloadPage() {
  const slug = useParams<{ slug: string }>()?.slug;
  const { getProjectBySlug } = useStore();
  const project = getProjectBySlug(slug ?? "");
  const detected = useMemo(detectPlatform, []);

  if (!project) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink px-6 text-center text-white">
        <div>
          <p className="font-display text-2xl font-bold">Không tìm thấy trang</p>
          <p className="mt-2 text-white/60">
            Không có trang tải xuống nào cho &ldquo;{slug}&rdquo;.
          </p>
          <Link
            href="/admin/projects"
            className="mt-6 inline-block rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-ink"
          >
            Quay lại trang quản trị
          </Link>
        </div>
      </div>
    );
  }

  const a = project.appearance;
  const light = isLightText(a);

  return (
    <div
      className="relative h-dvh w-full overflow-hidden"
      style={backgroundStyle(a)}
    >
      {/* Background image layer */}
      {a.backgroundType === "image" && a.backgroundImage && (
        <>
          <img
            src={a.backgroundImage}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: a.overlayStrength / 100 }}
          />
        </>
      )}

      {/* Soft glow shapes */}
      <div
        className="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full blur-3xl"
        style={{ background: light ? "rgba(129,140,248,0.28)" : "rgba(79,70,229,0.18)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-20 size-[28rem] rounded-full blur-3xl"
        style={{ background: light ? "rgba(56,189,248,0.18)" : "rgba(14,165,233,0.14)" }}
      />

      {/* Content */}
      <div className="relative flex h-dvh items-center justify-center overflow-hidden px-2.5 py-2 sm:px-4 sm:py-12">
        <div className="w-full max-w-[440px]">
          <DownloadCard project={project} detected={detected} />
        </div>
      </div>
    </div>
  );
}
