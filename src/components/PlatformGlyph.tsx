import { AppWindow } from "lucide-react";
import type { Platform } from "../lib/types";

export function PlatformGlyph({
  platform,
  className = "",
}: {
  platform: Platform;
  className?: string;
}) {
  if (platform.logo)
    return (
      <img
        src={platform.logo}
        alt={`${platform.name} logo`}
        className={`${className} rounded-md object-contain`}
      />
    );
  if (platform.kind === "android")
    return (
      <img
        src="/assets/platforms/google-play.svg"
        alt="Google Play"
        className={`${className} object-contain`}
      />
    );
  if (platform.kind === "ios")
    return (
      <img
        src="/assets/platforms/app-store.svg"
        alt="App Store"
        className={`${className} rounded-[22%] object-contain`}
      />
    );
  return <AppWindow className={className} />;
}
