import type { Appearance, CardRadius, GradientDirection } from "./types";

const gradientCss: Record<GradientDirection, string> = {
  ttb: "to bottom",
  ltr: "to right",
  tlbr: "to bottom right",
  trbl: "to bottom left",
};

export const gradientLabels: Record<GradientDirection, string> = {
  ttb: "Top to Bottom",
  ltr: "Left to Right",
  tlbr: "Top Left to Bottom Right",
  trbl: "Top Right to Bottom Left",
};

export function backgroundStyle(a: Appearance): React.CSSProperties {
  if (a.backgroundType === "solid") {
    return { background: a.solidColor };
  }
  if (a.backgroundType === "gradient") {
    return {
      background: `linear-gradient(${gradientCss[a.gradientDirection]}, ${a.gradientFrom}, ${a.gradientTo})`,
    };
  }
  return { background: a.backgroundImage ? "#0b1120" : "#1e293b" };
}

export function isLightText(a: Appearance): boolean {
  if (a.textTheme === "light") return true;
  if (a.textTheme === "dark") return false;
  // auto: infer from background luminance
  const hex =
    a.backgroundType === "solid"
      ? a.solidColor
      : a.backgroundType === "gradient"
        ? a.gradientTo
        : "#0b1120";
  return luminance(hex) < 0.5;
}

function luminance(hex: string): number {
  const c = hex.replace("#", "");
  if (c.length < 6) return 0.5;
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export const cardRadiusPx: Record<CardRadius, number> = {
  small: 16,
  medium: 22,
  large: 28,
};
