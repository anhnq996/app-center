"use client";

import Link from "next/link";
import { ArrowLeft, LayoutGrid, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../lib/auth";

export default function AppCenter({
  variant = "home",
}: {
  variant?: "home" | "notFound";
}) {
  const notFound = variant === "notFound";
  const router = useRouter();
  const { user, hasAdminAccess, isLoading } = useAuth();

  useEffect(() => {
    if (!notFound && !isLoading && user && hasAdminAccess) {
      router.replace("/admin/projects");
    }
  }, [hasAdminAccess, isLoading, notFound, router, user]);

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{ background: "linear-gradient(to bottom right, #1e1b4b, #0b1120)" }}
    >
      <div className="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-[rgba(129,140,248,0.25)] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 size-[28rem] rounded-full bg-[rgba(56,189,248,0.16)] blur-3xl" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-[440px] text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl">
            <LayoutGrid className="size-8 text-white" />
          </div>

          {notFound ? (
            <>
              <p className="font-display mt-7 text-sm font-bold uppercase tracking-[0.3em] text-white/50">
                Lỗi 404
              </p>
              <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-white">
                Không tìm thấy trang
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-white/60">
                Trang tải xuống này không tồn tại hoặc đã được di chuyển. Vui lòng kiểm tra
                lại đường dẫn và thử lại.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display mt-7 text-4xl font-extrabold tracking-tight text-white">
                App Center
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-white/60">
                Nơi phân phối ứng dụng đơn giản và an toàn trên mọi nền tảng. Mỗi nhà phát
                hành có thể chia sẻ riêng các liên kết tải xuống của mình.
              </p>
            </>
          )}

          {notFound && (
            <div className="mt-8">
              <Link
                href="/"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-sm font-bold text-ink transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.5)]"
              >
                <ArrowLeft className="size-4" />
                Quay lại App Center
              </Link>
            </div>
          )}

          <p className="mt-10 flex items-center justify-center gap-1.5 text-xs text-white/40">
            <ShieldCheck className="size-3.5" />
            Phân phối an toàn · Luôn là phiên bản mới nhất
          </p>
        </div>
      </div>
    </div>
  );
}
