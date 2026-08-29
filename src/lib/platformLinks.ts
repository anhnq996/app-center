import type { LinkBehavior, Platform } from "./types";

export function inferLinkBehavior(platform: Pick<Platform, "kind" | "url" | "source" | "linkBehavior">): LinkBehavior {
  if (platform.linkBehavior) return platform.linkBehavior;
  const url = platform.url.toLowerCase();
  if (platform.kind === "ios" && (url.startsWith("itms-services:") || url.includes(".plist"))) {
    return "ios-manifest";
  }
  if (url.includes("play.google.com") || url.includes("apps.apple.com")) return "store";
  return platform.source === "file" ? "download" : "download";
}

export function isIosOtaPlatform(
  platform: Pick<Platform, "kind" | "url" | "source" | "linkBehavior" | "iosOta">,
) {
  if (typeof platform.iosOta === "boolean") return platform.iosOta;
  return inferLinkBehavior(platform) === "ios-manifest";
}

export function platformHref(platform: Platform) {
  const url = platform.url.trim();
  if (!url) return "";
  if (!isIosOtaPlatform(platform) || url.startsWith("itms-services:")) {
    return url;
  }
  return `itms-services://?action=download-manifest&url=${encodeURIComponent(url)}`;
}

export function shouldDownloadFile(platform: Platform) {
  return platform.source === "file" && !isIosOtaPlatform(platform);
}
