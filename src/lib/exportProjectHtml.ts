import JSZip from "jszip";
import type { Platform, Project } from "./types";
import { platformHref, shouldDownloadFile } from "./platformLinks";

const directions = {
  ttb: "to bottom",
  ltr: "to right",
  tlbr: "to bottom right",
  trbl: "to bottom left",
} as const;
const radii = { small: 16, medium: 22, large: 28 } as const;

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character];
  });
}

function safeColor(value: string, fallback: string) {
  return /^#[0-9a-f]{3,8}$/i.test(value) ? value : fallback;
}

function safeUrl(value: string) {
  const url = value.trim();
  return /^(https?:|itms-services:|data:|blob:|\/|\.\/|\.\.\/)/i.test(url) ? escapeHtml(url) : "#";
}

function safeFileName(value: string, fallback: string) {
  const name = value.trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").replace(/[. ]+$/g, "");
  return name || fallback;
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .map((word) => word[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "AP"
  );
}

function isLightText(project: Project) {
  const appearance = project.appearance;
  if (appearance.textTheme === "light") return true;
  if (appearance.textTheme === "dark") return false;
  const hex =
    appearance.backgroundType === "solid"
      ? appearance.solidColor
      : appearance.backgroundType === "gradient"
        ? appearance.gradientTo
        : "#0b1120";
  const value = hex.replace("#", "");
  if (value.length !== 6) return true;
  const red = parseInt(value.slice(0, 2), 16) / 255;
  const green = parseInt(value.slice(2, 4), 16) / 255;
  const blue = parseInt(value.slice(4, 6), 16) / 255;
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue < 0.5;
}

function extensionFor(type: string) {
  const extensions: Record<string, string> = {
    "image/svg+xml": "svg",
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return extensions[type.split(";")[0].toLowerCase()] ?? "bin";
}

async function addAsset(zip: JSZip, source: string | null, name: string) {
  if (!source) return null;
  try {
    const response = await fetch(source);
    if (!response.ok) throw new Error("Asset request failed");
    const blob = await response.blob();
    const path = `assets/${safeFileName(name, "asset")}.${extensionFor(blob.type)}`;
    zip.file(path, await blob.arrayBuffer());
    return path;
  } catch {
    return safeUrl(source);
  }
}

function platformMarkup(platform: Platform, icon: string | null) {
  const subtitleIsVersion = [
    `version ${platform.version}`,
    `phiên bản ${platform.version}`,
  ].includes(platform.subtitle.trim().toLowerCase());
  const rawLabel =
    platform.label.replace(new RegExp(`\\s*${platform.name}$`, "i"), "").trim() ||
    "Tải xuống cho";
  const label = rawLabel.toLowerCase() === "download for" ? "Tải xuống cho" : rawLabel;
  const href = platformHref(platform);
  const download = shouldDownloadFile(platform);
  return `
    <a class="download-button" data-platform="${escapeHtml(platform.kind)}" href="${safeUrl(href)}"${href ? ' target="_blank" rel="noreferrer"' : ' data-empty-link="true"'}${download ? ` download="${escapeHtml(platform.fileName || "")}"` : ""}>
      <span class="platform-icon">${
        icon
          ? `<img src="${icon}" alt="${escapeHtml(platform.name)} logo">`
          : '<span class="generic-icon" aria-hidden="true">▣</span>'
      }</span>
      <span class="button-copy">
        <span class="button-label">${escapeHtml(label)}</span>
        <strong>${escapeHtml(platform.name)}</strong>
        ${platform.version ? `<span class="button-version">Phiên bản ${escapeHtml(platform.version)}</span>` : ""}
        ${platform.subtitle && !subtitleIsVersion ? `<span class="button-subtitle">${escapeHtml(platform.subtitle)}</span>` : ""}
      </span>
      <span class="recommended" hidden>Đề xuất</span>
      <svg class="download-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"></path><path d="m7 10 5 5 5-5"></path><path d="M5 21h14"></path></svg>
    </a>`;
}

export async function buildProjectArchive(project: Project) {
  const zip = new JSZip();
  const folderName = safeFileName(project.name, project.slug || "project");
  const root = zip.folder(folderName);
  if (!root) throw new Error("Unable to create export folder");

  const [googleIcon, appleIcon, projectLogo, companyLogo, backgroundImage] = await Promise.all([
    addAsset(root, "/assets/platforms/google-play.svg", "google-play"),
    addAsset(root, "/assets/platforms/app-store.svg", "app-store"),
    addAsset(root, project.projectLogo, "project-logo"),
    addAsset(root, project.companyLogo, "company-logo"),
    addAsset(root, project.appearance.backgroundImage, "background"),
  ]);
  const customIcons = await Promise.all(
    project.platforms.map((platform, index) =>
      addAsset(root, platform.logo, `platform-${index + 1}`),
    ),
  );

  const appearance = project.appearance;
  const light = isLightText(project);
  const strong = light ? "#ffffff" : "#0f1729";
  const muted = light ? "rgba(255,255,255,.58)" : "#64748b";
  const cardBackground =
    appearance.cardStyle === "transparent"
      ? "transparent"
      : appearance.cardStyle === "glass"
        ? light
          ? "rgba(255,255,255,.1)"
          : "rgba(255,255,255,.72)"
        : light
          ? "#141b2e"
          : "#ffffff";
  const cardBorder =
    appearance.cardStyle === "transparent"
      ? "transparent"
      : light
        ? "rgba(255,255,255,.15)"
        : "rgba(15,23,41,.1)";
  const buttonBackground = light ? "rgba(255,255,255,.1)" : "rgba(15,23,41,.04)";
  const buttonHover = light ? "rgba(255,255,255,.16)" : "rgba(15,23,41,.08)";
  const buttonBorder = light ? "rgba(255,255,255,.15)" : "rgba(15,23,41,.1)";
  const showIconBackground = project.showPlatformIconBackground ?? true;
  const iconBackground = showIconBackground ? (light ? "#fff" : "#0f1729") : "transparent";
  const iconRadius = showIconBackground ? "16px" : "0";
  const pageBackground =
    appearance.backgroundType === "solid"
      ? safeColor(appearance.solidColor, "#0f172a")
      : appearance.backgroundType === "gradient"
        ? `linear-gradient(${directions[appearance.gradientDirection]}, ${safeColor(appearance.gradientFrom, "#1e1b4b")}, ${safeColor(appearance.gradientTo, "#0f172a")})`
        : "#0b1120";
  const showCompanyLogo = (project.showCompanyLogo ?? true) && companyLogo;
  const showCompany = project.showCompanyName || showCompanyLogo;
  const platforms = project.platforms
    .map((platform, index) => ({ platform, index }))
    .filter(({ platform }) => platform.active)
    .map(({ platform, index }) =>
      platformMarkup(
        platform,
        customIcons[index] ??
          (platform.kind === "android" ? googleIcon : platform.kind === "ios" ? appleIcon : null),
      ),
    )
    .join("");

  const css = `
*{box-sizing:border-box}html,body{margin:0;min-height:100%;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
body{min-height:100vh;background:${pageBackground};color:${strong}}
.background-image,.overlay,.glow{position:fixed;inset:0;pointer-events:none}.background-image{width:100%;height:100%;object-fit:cover}.overlay{background:#000;opacity:${Math.min(80, Math.max(0, appearance.overlayStrength)) / 100}}
.glow.one{width:24rem;height:24rem;left:-6rem;top:-6rem;right:auto;bottom:auto;border-radius:50%;background:${light ? "rgba(129,140,248,.28)" : "rgba(79,70,229,.18)"};filter:blur(64px)}.glow.two{width:28rem;height:28rem;left:auto;top:auto;right:-5rem;bottom:-8rem;border-radius:50%;background:${light ? "rgba(56,189,248,.18)" : "rgba(14,165,233,.14)"};filter:blur(64px)}
main{position:relative;z-index:1;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:48px 16px}.card{width:100%;max-width:440px;padding:32px;border:1px solid ${cardBorder};border-radius:${radii[appearance.cardRadius]}px;background:${cardBackground};${appearance.cardStyle === "glass" ? "backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);" : ""}${appearance.cardStyle !== "transparent" ? "box-shadow:0 30px 80px -30px rgba(0,0,0,.6);" : ""}}
.company{margin-bottom:24px;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px}.company-logo{display:flex;align-items:center;justify-content:center;overflow:hidden;max-width:100%;width:${project.companyLogoWidth ?? 112}px;height:${project.companyLogoHeight ?? 28}px}.company-logo img,.project-logo img{display:block;max-width:100%;max-height:100%;object-fit:contain}.company-name{color:${muted};font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase}
.project{text-align:center;display:flex;flex-direction:column;align-items:center}.project-logo{display:grid;place-items:center;width:${project.projectLogoWidth ?? 152}px;height:${project.projectLogoHeight ?? 96}px;max-width:100%}.fallback-logo{width:100%;height:100%;display:grid;place-items:center;border-radius:24px;background:linear-gradient(135deg,#6366f1,#6d28d9);font-size:26px;font-weight:800;color:#fff}.project h1{margin:20px 0 0;font-size:26px;line-height:1.15;letter-spacing:-.025em}.project p{margin:6px 0 0;color:${muted};font-size:14px}
.buttons{display:flex;flex-direction:column;gap:10px;margin-top:28px}.download-button{position:relative;min-height:68px;display:flex;align-items:center;gap:14px;padding:14px 16px;border:1px solid ${buttonBorder};border-radius:18px;background:${buttonBackground};color:${strong};text-decoration:none;transition:.2s ease}.download-button:hover{transform:translateY(-2px);background:${buttonHover};box-shadow:0 16px 40px -16px rgba(15,23,41,.35)}.platform-icon{width:44px;height:44px;flex:0 0 auto;display:grid;place-items:center;border-radius:${iconRadius};background:${iconBackground}}.platform-icon img{width:25px;height:25px;object-fit:contain}.generic-icon{font-size:23px;color:${showIconBackground ? (light ? "#0f1729" : "#fff") : strong}}.button-copy{min-width:0;display:flex;flex-direction:column;text-align:left}.button-label{color:${muted};font-size:11px;font-weight:600;letter-spacing:.03em}.button-copy strong{font-size:15px;line-height:1.2}.button-version,.button-subtitle{color:${muted};font-size:11px;line-height:1.35}.button-subtitle{white-space:normal}.recommended{position:absolute;right:10px;top:8px;border-radius:999px;padding:3px 8px;background:${light ? "#fff" : "#4f46e5"};color:${light ? "#0f1729" : "#fff"};font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.06em}.download-icon{width:17px;height:17px;flex:0 0 auto;margin-left:auto;opacity:.48;transition:.2s ease}.download-button:hover .download-icon{transform:translateY(2px);opacity:.85}.empty,.security{text-align:center;color:${muted};font-size:11px}.empty{padding:16px 0;font-size:14px}.security{margin:24px 0 0}
@media(max-width:480px){main{padding:28px 12px}.card{padding:22px}.project h1{font-size:24px}.recommended{display:none}}
`.trim();

  const javascript = `
document.querySelectorAll('[data-empty-link="true"]').forEach(function(link){
  link.addEventListener('click',function(event){event.preventDefault();});
});
var userAgent=navigator.userAgent||'';
var platform=/android/i.test(userAgent)?'android':/iphone|ipad|ipod/i.test(userAgent)?'ios':null;
if(platform){
  var button=document.querySelector('[data-platform="'+platform+'"]');
  var list=document.querySelector('.buttons');
  if(button&&list){list.prepend(button);var badge=button.querySelector('.recommended');if(badge)badge.hidden=false;}
}
`.trim();

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Download ${escapeHtml(project.name || "application")}">
  <title>${escapeHtml(project.name || "App Center")}</title>
  <link rel="stylesheet" href="css/style.css">
  <script src="js/app.js" defer></script>
</head>
<body>
  ${appearance.backgroundType === "image" && backgroundImage ? `<img class="background-image" src="${backgroundImage}" alt=""><div class="overlay"></div>` : ""}
  <div class="glow one"></div><div class="glow two"></div>
  <main><section class="card">
    ${showCompany ? `<div class="company">${showCompanyLogo ? `<span class="company-logo"><img src="${companyLogo}" alt="${escapeHtml(project.company || "Company")} logo"></span>` : ""}${project.showCompanyName ? `<span class="company-name">${escapeHtml(project.company || "Company")}</span>` : ""}</div>` : ""}
    <div class="project">
      <div class="project-logo">${projectLogo ? `<img src="${projectLogo}" alt="${escapeHtml(project.name)}">` : `<div class="fallback-logo">${escapeHtml(initials(project.name || "App"))}</div>`}</div>
      <h1>${escapeHtml(project.name || "Your App")}</h1>
      <p>Chọn nền tảng để tải xuống</p>
    </div>
    <div class="buttons">${platforms || '<p class="empty">Chưa có nền tảng tải xuống nào đang hoạt động.</p>'}</div>
    <p class="security">Tải xuống an toàn · Luôn là phiên bản mới nhất</p>
  </section></main>
</body>
</html>`;

  root.file("index.html", html);
  root.file("css/style.css", css);
  root.file("js/app.js", javascript);

  const archive = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  return { archive, folderName };
}

export async function downloadProjectHtml(project: Project) {
  const { archive, folderName } = await buildProjectArchive(project);
  const url = URL.createObjectURL(archive);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${folderName}.zip`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
