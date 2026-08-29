export type PlatformKind = "android" | "ios" | "custom";
export type DownloadSource = "file" | "link";

export interface PlatformVersion {
  id: string;
  version: string;
  source: DownloadSource;
  url: string;
  fileName: string | null;
  fileSize: string | null;
  label: string;
  subtitle: string;
  savedAt: string;
}

export interface Platform {
  id: string;
  kind: PlatformKind;
  name: string;
  logo: string | null; // data URL for custom logos
  source: DownloadSource;
  url: string;
  fileName: string | null;
  fileSize: string | null;
  label: string;
  subtitle: string;
  version: string;
  active: boolean;
  history: PlatformVersion[]; // up to 3 most recent previous versions
}

export type BackgroundType = "solid" | "gradient" | "image";
export type GradientDirection = "ttb" | "ltr" | "tlbr" | "trbl";
export type TextTheme = "auto" | "light" | "dark";
export type CardStyle = "solid" | "glass" | "transparent";
export type CardRadius = "small" | "medium" | "large";

export interface Appearance {
  backgroundType: BackgroundType;
  solidColor: string;
  gradientFrom: string;
  gradientTo: string;
  gradientDirection: GradientDirection;
  backgroundImage: string | null;
  overlayStrength: number; // 0 - 80
  textTheme: TextTheme;
  cardStyle: CardStyle;
  cardRadius: CardRadius;
}

export type UserRole = "owner" | "editor" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  company: string;
  slug: string;
  status: "active" | "inactive";
  projectLogo: string | null;
  projectLogoWidth?: number;
  projectLogoHeight?: number;
  companyLogo: string | null;
  companyLogoWidth?: number;
  companyLogoHeight?: number;
  showCompanyLogo?: boolean;
  showCompanyName: boolean;
  updatedAt: string;
  appearance: Appearance;
  platforms: Platform[];
  ownerId: string;
  memberIds: string[];
}
