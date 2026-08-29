import type { Platform, PlatformVersion } from "./types";
import { uid } from "./data";

export const MAX_VERSIONS = 3;

/** Whether the downloadable content meaningfully changed. */
export function versionChanged(prev: Platform, next: Platform): boolean {
  return (
    prev.version !== next.version ||
    prev.url !== next.url ||
    prev.fileName !== next.fileName
  );
}

export function snapshotOf(p: Platform): PlatformVersion {
  return {
    id: uid("ver"),
    version: p.version || "—",
    source: p.source,
    url: p.url,
    fileName: p.fileName,
    fileSize: p.fileSize,
    label: p.label,
    subtitle: p.subtitle,
    savedAt: new Date().toISOString(),
  };
}

/**
 * When saving an edited platform, snapshot the previous state into history
 * (keeping only the 3 most recent) if the content changed.
 */
export function withVersionSnapshot(prev: Platform, next: Platform): Platform {
  if (!versionChanged(prev, next)) return next;
  return {
    ...next,
    history: [snapshotOf(prev), ...next.history].slice(0, MAX_VERSIONS),
  };
}
