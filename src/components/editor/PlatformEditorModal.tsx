import { useEffect, useState } from "react";
import { FileUp, FileCheck2, History, RotateCcw, FileArchive, LinkIcon } from "lucide-react";
import type { Platform, PlatformVersion } from "../../lib/types";
import {
  Button,
  Field,
  Input,
  Modal,
  ModalHeader,
  Segmented,
  Toggle,
  useToast,
} from "../ui";
import { LogoUploader } from "../ImageUploader";
import { PlatformGlyph } from "../PlatformGlyph";
import { uid } from "../../lib/data";
import { MAX_VERSIONS } from "../../lib/versioning";

function relTime(iso: string) {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function PlatformEditorModal({
  open,
  platform,
  mode,
  onClose,
  onSave,
}: {
  open: boolean;
  platform: Platform | null;
  mode: "edit" | "add";
  onClose: () => void;
  onSave: (p: Platform) => void;
}) {
  const [draft, setDraft] = useState<Platform | null>(platform);
  const toast = useToast();

  useEffect(() => {
    setDraft(
      platform ?? {
        id: uid("plat"),
        kind: "custom",
        name: "",
        logo: null,
        source: "link",
        url: "",
        fileName: null,
        fileSize: null,
        label: "",
        subtitle: "",
        version: "1.0.0",
        active: true,
        history: [],
      },
    );
  }, [platform, open]);

  if (!draft) return null;
  const set = <K extends keyof Platform>(k: K, v: Platform[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d));

  const isBuiltIn = draft.kind !== "custom";

  const simulateApk = () => {
    const version = draft.version || "1.0.0";
    set("fileName", `${(draft.name || "app").toLowerCase()}-v${version}.apk`);
    set("fileSize", "42.6 MB");
  };

  const rollback = (v: PlatformVersion) => {
    setDraft((d) =>
      d
        ? {
            ...d,
            version: v.version,
            source: v.source,
            url: v.url,
            fileName: v.fileName,
            fileSize: v.fileSize,
            label: v.label,
            subtitle: v.subtitle,
          }
        : d,
    );
    toast(`Restored v${v.version} — Save to apply`);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader
        title={mode === "add" ? "Add Download Button" : `Edit ${draft.name || "Platform"}`}
        subtitle="Configure how this platform appears and downloads."
        onClose={onClose}
      />
      <div className="flex flex-col gap-5 p-6">
        {/* Name + icon */}
        <div className="flex items-end gap-4">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-ink text-white">
            <PlatformGlyph platform={draft} className="size-7" />
          </div>
          <div className="flex-1">
            <Field label="Platform Name">
              <Input
                value={draft.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Windows"
                disabled={isBuiltIn}
              />
            </Field>
          </div>
        </div>

        {draft.kind === "custom" && (
          <Field label="Platform Logo" hint="Square image works best (PNG or SVG).">
            <LogoUploader
              value={draft.logo}
              onChange={(v) => set("logo", v)}
              size={64}
              radius={16}
              fallback={<PlatformGlyph platform={draft} className="size-6 text-ink-faint" />}
            />
          </Field>
        )}

        {/* Source */}
        <Field label="Download Source">
          <Segmented
            value={draft.source}
            onChange={(v) => set("source", v)}
            options={[
              { value: "file", label: "File" },
              { value: "link", label: "Link" },
            ]}
          />
        </Field>

        {draft.source === "file" ? (
          <Field
            label={draft.kind === "android" ? "Upload APK" : "Upload File"}
            hint="Demo only — no file is actually uploaded."
          >
            {draft.fileName ? (
              <div className="flex items-center gap-3 rounded-xl border border-line bg-bg px-3.5 py-3">
                <FileCheck2 className="size-5 text-success" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {draft.fileName}
                  </p>
                  <p className="text-xs text-ink-faint">{draft.fileSize}</p>
                </div>
                <button
                  onClick={() => {
                    set("fileName", null);
                    set("fileSize", null);
                  }}
                  className="text-xs font-semibold text-ink-soft hover:text-danger"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={simulateApk}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line-strong bg-bg py-6 text-sm font-semibold text-ink-soft transition hover:border-brand hover:text-brand"
              >
                <FileUp className="size-5" />
                Choose file to upload
              </button>
            )}
          </Field>
        ) : (
          <Field label="Download URL">
            <Input
              value={draft.url}
              onChange={(e) => set("url", e.target.value)}
              placeholder="https://play.google.com/store/apps/details?id=..."
            />
          </Field>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Version" hint="Changing this snapshots the previous version.">
            <Input
              value={draft.version}
              onChange={(e) => set("version", e.target.value)}
              placeholder="2.1.0"
              className="font-mono"
            />
          </Field>
          <Field label="Subtitle">
            <Input
              value={draft.subtitle}
              onChange={(e) => set("subtitle", e.target.value)}
              placeholder="Windows 10 or later"
            />
          </Field>
        </div>

        <Field label="Button Label">
          <Input
            value={draft.label}
            onChange={(e) => set("label", e.target.value)}
            placeholder="Download for Windows"
          />
        </Field>

        {/* Version history */}
        {draft.history.length > 0 && (
          <div className="rounded-xl border border-line bg-bg p-4">
            <div className="mb-3 flex items-center gap-2">
              <History className="size-4 text-ink-soft" />
              <span className="text-sm font-semibold text-ink">Version history</span>
              <span className="text-xs text-ink-faint">
                (last {MAX_VERSIONS} kept)
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {draft.history.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-3 rounded-lg border border-line bg-surface p-2.5"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-bg text-ink-soft">
                    {v.source === "file" ? (
                      <FileArchive className="size-4" />
                    ) : (
                      <LinkIcon className="size-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      <span className="font-mono">v{v.version}</span>
                      {v.fileName && (
                        <span className="ml-2 text-xs font-normal text-ink-faint">
                          {v.fileName} · {v.fileSize}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-ink-faint">Saved {relTime(v.savedAt)}</p>
                  </div>
                  <button
                    onClick={() => rollback(v)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-ink-soft transition hover:border-brand hover:bg-brand-soft hover:text-brand"
                  >
                    <RotateCcw className="size-3.5" />
                    Rollback
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between rounded-xl border border-line bg-bg px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-ink">Active</p>
            <p className="text-xs text-ink-faint">Show this button on the public page.</p>
          </div>
          <Toggle checked={draft.active} onChange={(v) => set("active", v)} />
        </div>
      </div>

      <div className="flex justify-end gap-2.5 border-t border-line px-6 py-4">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={() => onSave(draft)}
          disabled={!draft.name.trim()}
        >
          {mode === "add" ? "Add Platform" : "Save"}
        </Button>
      </div>
    </Modal>
  );
}
