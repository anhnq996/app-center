import { Download } from "lucide-react";
import type { Project, Platform } from "../lib/types";
import { cardRadiusPx, isLightText } from "../lib/appearance";
import { PlatformGlyph } from "./PlatformGlyph";

function initials(name: string) {
  return (
    name
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "AP"
  );
}

function DownloadButton({
  platform,
  light,
  recommended,
  compact,
}: {
  platform: Platform;
  light: boolean;
  recommended?: boolean;
  compact?: boolean;
}) {
  const rawLabel =
    platform.label.replace(new RegExp(`\\s*${platform.name}$`, "i"), "").trim() ||
    "Tải xuống cho";
  const label = rawLabel.toLowerCase() === "download for" ? "Tải xuống cho" : rawLabel;
  const subtitleIsVersion = [
    `version ${platform.version}`,
    `phiên bản ${platform.version}`,
  ].includes(platform.subtitle.trim().toLowerCase());

  return (
    <a
      href={platform.url || "#"}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => !platform.url && e.preventDefault()}
      className={`group relative flex items-center gap-3.5 rounded-[18px] border px-4 transition-all duration-200 hover:-translate-y-0.5 ${
        compact ? "py-3" : "py-3.5"
      } ${
        light
          ? "border-white/15 bg-white/10 text-white hover:bg-white/16 hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.5)]"
          : "border-ink/10 bg-ink/[0.04] text-ink hover:bg-ink/[0.07] hover:shadow-[0_16px_40px_-16px_rgba(15,23,41,0.35)]"
      }`}
      style={{ minHeight: compact ? 60 : 68 }}
    >
      <span
        className={`grid size-11 shrink-0 place-items-center rounded-2xl ${
          light ? "bg-white text-ink" : "bg-ink text-white"
        }`}
      >
        <PlatformGlyph platform={platform} className="size-6" />
      </span>
      <span className="flex min-w-0 flex-col text-left">
        <span
          className={`text-[11px] font-medium tracking-wide ${
            light ? "text-white/60" : "text-ink-faint"
          }`}
        >
          {label}
        </span>
        <span className="truncate text-[15px] font-bold leading-tight">
          {platform.name}
        </span>
        {platform.version && (
          <span className={`text-[11px] ${light ? "text-white/50" : "text-ink-faint"}`}>
            Phiên bản {platform.version}
          </span>
        )}
        {platform.subtitle && !subtitleIsVersion && (
            <span
              className={`whitespace-normal text-[11px] leading-snug ${
                light ? "text-white/50" : "text-ink-faint"
              }`}
            >
              {platform.subtitle}
            </span>
          )}
      </span>
      {recommended && (
        <span
          className={`absolute right-2.5 top-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
            light ? "bg-white text-ink" : "bg-brand text-white"
          }`}
        >
          Đề xuất
        </span>
      )}
      <Download
        className="ml-auto size-4 shrink-0 opacity-40 transition-all duration-200 group-hover:translate-y-0.5 group-hover:opacity-80"
      />
    </a>
  );
}

export function DownloadCard({
  project,
  detected,
  compact = false,
}: {
  project: Project;
  detected?: "android" | "ios" | null;
  compact?: boolean;
}) {
  const light = isLightText(project.appearance);
  const radius = cardRadiusPx[project.appearance.cardRadius];

  const cardStyleClass =
    project.appearance.cardStyle === "glass"
      ? light
        ? "bg-white/10 backdrop-blur-xl border border-white/15"
        : "bg-white/70 backdrop-blur-xl border border-ink/10"
      : project.appearance.cardStyle === "transparent"
        ? "bg-transparent"
        : light
          ? "bg-[#141b2e] border border-white/10"
          : "bg-white border border-ink/[0.06]";

  let platforms = project.platforms.filter((p) => p.active);
  if (detected) {
    platforms = [...platforms].sort((a, b) => {
      const aMatch = a.kind === detected ? -1 : 0;
      const bMatch = b.kind === detected ? -1 : 0;
      return aMatch - bMatch;
    });
  }

  const muted = light ? "text-white/55" : "text-ink-faint";
  const strong = light ? "text-white" : "text-ink";

  return (
    <div
      className={`w-full ${cardStyleClass} ${
        project.appearance.cardStyle === "transparent"
          ? ""
          : "shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]"
      }`}
      style={{ borderRadius: radius, padding: compact ? 20 : 32 }}
    >
      {/* Company */}
      {(project.showCompanyName || ((project.showCompanyLogo ?? true) && project.companyLogo)) && (
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
          {(project.showCompanyLogo ?? true) && project.companyLogo ? (
            <span
              className="flex max-w-full shrink-0 items-center justify-center overflow-hidden"
              style={{
                width: project.companyLogoWidth ?? 112,
                height: project.companyLogoHeight ?? 28,
              }}
            >
              <img
                src={project.companyLogo}
                alt={`${project.company || "Company"} logo`}
                className="max-h-full max-w-full object-contain"
              />
            </span>
          ) : null}
          {project.showCompanyName && (
            <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${muted}`}>
              {project.company || "Company"}
            </span>
          )}
        </div>
      )}

      {/* App logo + name */}
      <div className="flex flex-col items-center text-center">
        <div
          className="grid place-items-center"
          style={{
            width: project.projectLogoWidth ?? 152,
            height: project.projectLogoHeight ?? 96,
            maxWidth: "100%",
          }}
        >
          {project.projectLogo ? (
            <img
              src={project.projectLogo}
              alt={project.name}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="grid size-full place-items-center bg-gradient-to-br from-indigo-500 to-violet-700">
              <span className="font-display text-2xl font-extrabold text-white">
                {initials(project.name || "App")}
              </span>
            </div>
          )}
        </div>
        <h1
          className={`font-display mt-5 text-[26px] font-extrabold leading-tight tracking-tight ${strong}`}
        >
          {project.name || "Your App"}
        </h1>
        <p className={`mt-1.5 text-sm ${muted}`}>Chọn nền tảng để tải xuống</p>
      </div>

      {/* Buttons */}
      <div className="mt-7 flex flex-col gap-2.5">
        {platforms.length === 0 && (
          <p className={`py-4 text-center text-sm ${muted}`}>
            Chưa có nền tảng tải xuống nào đang hoạt động.
          </p>
        )}
        {platforms.map((p) => (
          <DownloadButton
            key={p.id}
            platform={p}
            light={light}
            compact={compact}
            recommended={detected != null && p.kind === detected}
          />
        ))}
      </div>

      <p className={`mt-6 text-center text-[11px] ${muted}`}>
        Tải xuống an toàn · Luôn là phiên bản mới nhất
      </p>
    </div>
  );
}
