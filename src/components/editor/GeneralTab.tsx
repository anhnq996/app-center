import { Boxes, Building2 } from "lucide-react";
import type { Project } from "../../lib/types";
import { Field, Input, Segmented, Toggle } from "../ui";
import { LogoUploader } from "../ImageUploader";
import { Card } from "./parts";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/g, "");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function GeneralTab({
  draft,
  patch,
  slugTaken = false,
}: {
  draft: Project;
  patch: (p: Partial<Project>) => void;
  slugTaken?: boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      <Card title="Project Information">
        <div className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Project Name">
              <Input
                value={draft.name}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder="Gosang Mobile"
              />
            </Field>
            <Field label="Company Name">
              <Input
                value={draft.company}
                onChange={(e) => patch({ company: e.target.value })}
                placeholder="Gosang Corp"
              />
            </Field>
          </div>
          <Field
            label="Public Slug"
            hint={slugTaken ? (
              <span className="font-semibold text-danger">This slug is already used by another project.</span>
            ) : (
              <>
                Public page: <span className="font-mono text-ink-soft">/{draft.slug || "your-slug"}</span>
              </>
            )}
          >
            <Input
              value={draft.slug}
              onChange={(e) => patch({ slug: slugify(e.target.value) })}
              onBlur={() => patch({ slug: draft.slug.replace(/-+$/g, "") })}
              placeholder="gosang-mobile"
              className={slugTaken ? "border-danger focus:border-danger focus:ring-danger/10" : ""}
            />
          </Field>
          <Field label="Status">
            <Segmented
              value={draft.status}
              onChange={(v) => patch({ status: v })}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          </Field>
        </div>
      </Card>

      <Card title="Project Logo" desc="Shown prominently on the public download page.">
        <LogoUploader
          value={draft.projectLogo}
          onChange={(v) => patch({ projectLogo: v })}
          uploadProjectId={draft.id}
          uploadSlot="project-logo"
          fallback={<Boxes className="size-8 text-ink-faint" />}
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Logo width" hint="24–240 px">
            <div className="relative">
              <Input
                type="number"
                min={24}
                max={240}
                value={draft.projectLogoWidth ?? 152}
                onChange={(e) =>
                  patch({ projectLogoWidth: clamp(Number(e.target.value), 24, 240) })
                }
                className="pr-10"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-faint">
                px
              </span>
            </div>
          </Field>
          <Field label="Logo height" hint="16–160 px">
            <div className="relative">
              <Input
                type="number"
                min={16}
                max={160}
                value={draft.projectLogoHeight ?? 96}
                onChange={(e) =>
                  patch({ projectLogoHeight: clamp(Number(e.target.value), 16, 160) })
                }
                className="pr-10"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-faint">
                px
              </span>
            </div>
          </Field>
        </div>
      </Card>

      <Card title="Company Logo">
        <LogoUploader
          value={draft.companyLogo}
          onChange={(v) => patch({ companyLogo: v })}
          uploadProjectId={draft.id}
          uploadSlot="company-logo"
          size={72}
          radius={0}
          framed={false}
          fallback={<Building2 className="size-7 text-ink-faint" />}
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Logo width" hint="24–240 px">
            <div className="relative">
              <Input
                type="number"
                min={24}
                max={240}
                value={draft.companyLogoWidth ?? 112}
                onChange={(e) =>
                  patch({ companyLogoWidth: clamp(Number(e.target.value), 24, 240) })
                }
                className="pr-10"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-faint">
                px
              </span>
            </div>
          </Field>
          <Field label="Logo height" hint="16–120 px">
            <div className="relative">
              <Input
                type="number"
                min={16}
                max={120}
                value={draft.companyLogoHeight ?? 28}
                onChange={(e) =>
                  patch({ companyLogoHeight: clamp(Number(e.target.value), 16, 120) })
                }
                className="pr-10"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-faint">
                px
              </span>
            </div>
          </Field>
        </div>
        <div className="mt-5 flex items-center justify-between rounded-xl border border-line bg-bg px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-ink">Show company logo</p>
            <p className="text-xs text-ink-faint">
              Display the company logo on the download page.
            </p>
          </div>
          <Toggle
            checked={draft.showCompanyLogo ?? true}
            onChange={(v) => patch({ showCompanyLogo: v })}
          />
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl border border-line bg-bg px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-ink">Show company name</p>
            <p className="text-xs text-ink-faint">
              Display the company name on the download page.
            </p>
          </div>
          <Toggle
            checked={draft.showCompanyName}
            onChange={(v) => patch({ showCompanyName: v })}
          />
        </div>
      </Card>
    </div>
  );
}
