"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Pencil,
  Eye,
  Link2,
  Trash2,
  Boxes,
} from "lucide-react";
import { useStore } from "../lib/store";
import { Button, ConfirmDialog, StatusBadge, useToast } from "../components/ui";
import { Avatar } from "../components/UserBits";
import type { Project } from "../lib/types";

function timeAgo(iso: string) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  const days = Math.floor(diff / 86400);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function ProjectLogo({ project }: { project: Project }) {
  if (project.projectLogo)
    return (
      <img
        src={project.projectLogo}
        alt=""
        className="size-12 rounded-2xl border border-line object-cover"
      />
    );
  return (
    <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-700 font-display text-sm font-extrabold text-white">
      {project.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "AP"}
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Eye;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`grid size-9 place-items-center rounded-lg border border-line bg-surface transition hover:border-line-strong ${
        danger
          ? "text-ink-faint hover:bg-danger/10 hover:text-danger"
          : "text-ink-soft hover:bg-bg hover:text-ink"
      }`}
    >
      <Icon className="size-[17px]" />
    </button>
  );
}

function MemberStack({ ids }: { ids: string[] }) {
  const { users } = useStore();
  const members = ids.map((id) => users.find((u) => u.id === id)).filter(Boolean);
  const shown = members.slice(0, 3);
  const extra = members.length - shown.length;
  return (
    <div className="flex items-center -space-x-2">
      {shown.map(
        (m) =>
          m && (
            <div key={m.id} className="ring-2 ring-surface rounded-full">
              <Avatar user={m} size={26} />
            </div>
          ),
      )}
      {extra > 0 && (
        <div className="grid size-[26px] place-items-center rounded-full bg-bg text-[10px] font-bold text-ink-soft ring-2 ring-surface">
          +{extra}
        </div>
      )}
    </div>
  );
}

export default function Projects() {
  const { projects, deleteProject } = useStore();
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [toDelete, setToDelete] = useState<Project | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.company.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q),
    );
  }, [projects, query]);

  const copyLink = (p: Project) => {
    const url = `${window.location.origin}/download/${p.slug}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    toast("Public link copied");
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
            Projects
          </h1>
          <p className="mt-1 text-ink-soft">Manage your app download pages.</p>
        </div>
        <Button onClick={() => router.push("/admin/projects/new")} className="h-11">
          <Plus className="size-4" />
          Create Project
        </Button>
      </div>

      {/* Search */}
      <div className="relative mt-6">
        <Search className="absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects..."
          className="w-full rounded-xl border border-line-strong bg-surface py-2.5 pl-11 pr-4 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:ring-4 focus:ring-brand/10 sm:max-w-sm"
        />
      </div>

      {/* List */}
      <div className="mt-5 grid gap-3">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="group flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 transition hover:border-line-strong hover:shadow-[0_12px_30px_-18px_rgba(15,23,41,0.25)] sm:flex-row sm:items-center sm:gap-5 sm:p-5"
          >
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <ProjectLogo project={p} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display truncate text-[17px] font-bold text-ink">
                    {p.name}
                  </h3>
                  <StatusBadge status={p.status} />
                </div>
                <p className="text-sm text-ink-soft">{p.company}</p>
                <p className="mt-0.5 truncate font-mono text-xs text-ink-faint">
                  /download/{p.slug}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <MemberStack ids={p.memberIds} />
              <span className="hidden text-xs text-ink-faint sm:inline">
                Updated {timeAgo(p.updatedAt)}
              </span>
              <div className="flex items-center gap-1.5">
                <ActionButton
                  icon={Pencil}
                  label="Edit"
                  onClick={() => router.push(`/admin/projects/${p.id}`)}
                />
                <ActionButton
                  icon={Eye}
                  label="Preview"
                  onClick={() => window.open(`/download/${p.slug}`, "_blank")}
                />
                <ActionButton icon={Link2} label="Copy Link" onClick={() => copyLink(p)} />
                <ActionButton
                  icon={Trash2}
                  label="Delete"
                  danger
                  onClick={() => setToDelete(p)}
                />
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="grid place-items-center rounded-2xl border border-dashed border-line-strong bg-surface py-16 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-bg text-ink-faint">
              <Boxes className="size-6" />
            </div>
            <p className="mt-4 font-display font-bold text-ink">No projects found</p>
            <p className="mt-1 text-sm text-ink-soft">
              {query ? "Try a different search." : "Create your first download page."}
            </p>
            {!query && (
              <Link
                href="/admin/projects/new"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Plus className="size-4" />
                Create Project
              </Link>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title={`Delete "${toDelete?.name}"?`}
        message="This will permanently remove the project and its public download page. This action cannot be undone."
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) {
            try {
              await deleteProject(toDelete.id);
              toast("Project deleted");
            } catch {
              toast("Unable to delete project from Firestore");
            }
          }
          setToDelete(null);
        }}
      />
    </div>
  );
}
