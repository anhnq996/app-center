import { useState } from "react";
import { GripVertical, History, Pencil, Plus, Trash2 } from "lucide-react";
import type { Platform, Project } from "../../lib/types";
import { Button, ConfirmDialog, Toggle } from "../ui";
import { PlatformGlyph } from "../PlatformGlyph";
import { PlatformEditorModal } from "./PlatformEditorModal";
import { withVersionSnapshot } from "../../lib/versioning";
import { Card } from "./parts";

export function DownloadButtonsTab({
  draft,
  patch,
}: {
  draft: Project;
  patch: (p: Partial<Project>) => void;
}) {
  const platforms = draft.platforms;
  const setPlatforms = (next: Platform[]) => patch({ platforms: next });

  const [editing, setEditing] = useState<Platform | null>(null);
  const [adding, setAdding] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Platform | null>(null);

  const toggleActive = (id: string, v: boolean) =>
    setPlatforms(platforms.map((p) => (p.id === id ? { ...p, active: v } : p)));

  const savePlatform = (p: Platform) => {
    const prev = platforms.find((x) => x.id === p.id);
    if (prev) {
      const versioned = withVersionSnapshot(prev, p);
      setPlatforms(platforms.map((x) => (x.id === p.id ? versioned : x)));
    } else {
      setPlatforms([...platforms, p]);
    }
    setEditing(null);
    setAdding(false);
  };

  const reorder = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const from = platforms.findIndex((p) => p.id === dragId);
    const to = platforms.findIndex((p) => p.id === targetId);
    const next = [...platforms];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setPlatforms(next);
  };

  return (
    <Card
      title="Download Buttons"
      desc="Manage the platforms available on your public download page."
    >
      <div className="mb-5 flex items-center justify-between rounded-xl border border-line bg-bg px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-ink">Show icon background</p>
          <p className="text-xs text-ink-faint">
            Display the colored frame behind each platform icon.
          </p>
        </div>
        <Toggle
          checked={draft.showPlatformIconBackground ?? true}
          onChange={(value) => patch({ showPlatformIconBackground: value })}
        />
      </div>
      <div className="flex flex-col gap-2.5">
        {platforms.map((p) => (
          <div
            key={p.id}
            draggable
            onDragStart={() => setDragId(p.id)}
            onDragEnd={() => {
              setDragId(null);
              setOverId(null);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setOverId(p.id);
            }}
            onDrop={() => {
              reorder(p.id);
              setOverId(null);
            }}
            className={`flex items-center gap-3 rounded-xl border bg-surface p-3 transition ${
              dragId === p.id
                ? "opacity-40"
                : overId === p.id
                  ? "border-brand ring-2 ring-brand/15"
                  : "border-line hover:border-line-strong"
            }`}
          >
            <button
              className="cursor-grab touch-none text-ink-faint hover:text-ink active:cursor-grabbing"
              aria-label="Drag to reorder"
            >
              <GripVertical className="size-5" />
            </button>
            <div
              className={`grid size-11 shrink-0 place-items-center ${
                draft.showPlatformIconBackground ?? true
                  ? "rounded-xl bg-ink text-white"
                  : "bg-transparent text-ink"
              }`}
            >
              <PlatformGlyph platform={p} className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-display truncate text-sm font-bold text-ink">{p.name}</p>
                {p.version && (
                  <span className="rounded-md bg-bg px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ink-soft">
                    v{p.version}
                  </span>
                )}
                {p.history.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-brand-soft px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                    <History className="size-3" />
                    {p.history.length}
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-ink-soft">
                {p.label || "Download button"}
              </p>
            </div>
            <Toggle checked={p.active} onChange={(v) => toggleActive(p.id, v)} />
            <button
              onClick={() => setEditing(p)}
              className="grid size-9 place-items-center rounded-lg border border-line text-ink-soft transition hover:bg-bg hover:text-ink"
              aria-label="Edit platform"
            >
              <Pencil className="size-[17px]" />
            </button>
            {p.kind === "custom" && (
              <button
                onClick={() => setToDelete(p)}
                className="grid size-9 place-items-center rounded-lg border border-line text-ink-faint transition hover:bg-danger/10 hover:text-danger"
                aria-label="Delete platform"
              >
                <Trash2 className="size-[17px]" />
              </button>
            )}
          </div>
        ))}
      </div>

      <Button
        variant="secondary"
        className="mt-4 w-full border-dashed"
        onClick={() => setAdding(true)}
      >
        <Plus className="size-4" />
        Add Download Button
      </Button>

      <PlatformEditorModal
        open={!!editing}
        mode="edit"
        platform={editing}
        projectSlug={draft.slug}
        projectId={draft.id}
        onClose={() => setEditing(null)}
        onSave={savePlatform}
      />
      <PlatformEditorModal
        open={adding}
        mode="add"
        platform={null}
        projectSlug={draft.slug}
        projectId={draft.id}
        onClose={() => setAdding(false)}
        onSave={savePlatform}
      />

      <ConfirmDialog
        open={!!toDelete}
        title={`Remove "${toDelete?.name}"?`}
        message="This platform button will be removed from the public download page."
        confirmLabel="Remove"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) setPlatforms(platforms.filter((x) => x.id !== toDelete.id));
          setToDelete(null);
        }}
      />
    </Card>
  );
}
