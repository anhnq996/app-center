"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, Eye, FileDown, Save, Smartphone } from "lucide-react";
import { useStore } from "../lib/store";
import { newProject } from "../lib/data";
import type { Project } from "../lib/types";
import { backgroundStyle } from "../lib/appearance";
import { downloadProjectHtml } from "../lib/exportProjectHtml";
import { Button, useToast } from "../components/ui";
import { GeneralTab } from "../components/editor/GeneralTab";
import { AppearanceTab } from "../components/editor/AppearanceTab";
import { DownloadButtonsTab } from "../components/editor/DownloadButtonsTab";
import { MembersTab } from "../components/editor/MembersTab";
import { DownloadCard } from "../components/DownloadCard";

type Tab = "general" | "appearance" | "buttons" | "members";
const tabs: { id: Tab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "appearance", label: "Appearance" },
  { id: "buttons", label: "Download Buttons" },
  { id: "members", label: "Members" },
];

function PhonePreview({ project }: { project: Project }) {
  return (
    <div className="mx-auto w-full max-w-[320px]">
      <div className="rounded-[42px] border-[10px] border-ink bg-ink p-0 shadow-[0_30px_60px_-20px_rgba(15,23,41,0.5)]">
        <div className="relative overflow-hidden rounded-[32px]">
          <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-ink" />
          <div
            className="relative flex min-h-[560px] items-center justify-center overflow-y-auto px-4 py-10"
            style={backgroundStyle(project.appearance)}
          >
            {project.appearance.backgroundType === "image" &&
              project.appearance.backgroundImage && (
                <>
                  <img
                    src={project.appearance.backgroundImage}
                    alt=""
                    className="absolute inset-0 size-full object-cover"
                  />
                  <div
                    className="absolute inset-0 bg-black"
                    style={{ opacity: project.appearance.overlayStrength / 100 }}
                  />
                </>
              )}
            <div className="relative w-full">
              <DownloadCard project={project} compact />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectEditor() {
  const id = useParams<{ id: string }>()?.id;
  const router = useRouter();
  const toast = useToast();
  const { getProject, addProject, updateProject, currentUser } = useStore();

  const isNew = id === "new" || !id;
  const existing = isNew ? undefined : getProject(id!);

  const [draft, setDraft] = useState<Project>(() => existing ?? newProject(currentUser.id));
  const [tab, setTab] = useState<Tab>("general");

  useEffect(() => {
    if (existing) setDraft(existing);
  }, [existing]);

  const patch = (p: Partial<Project>) => setDraft((d) => ({ ...d, ...p }));

  const canSave = useMemo(
    () => draft.name.trim() && draft.slug.trim(),
    [draft.name, draft.slug],
  );

  const save = async () => {
    if (!canSave) {
      toast("Add a project name and slug first");
      return;
    }
    try {
      if (isNew && !getProject(draft.id)) await addProject(draft);
      else await updateProject(draft);
      toast("Changes saved");
      if (isNew) router.push(`/admin/projects/${draft.id}`);
    } catch {
      toast("Unable to save changes to Firestore");
    }
  };

  const preview = async () => {
    try {
      if (isNew && !getProject(draft.id)) await addProject(draft);
      else await updateProject(draft);
      window.open(`/download/${draft.slug}`, "_blank");
    } catch {
      toast("Unable to save changes to Firestore");
    }
  };

  const exportHtml = async () => {
    try {
      await downloadProjectHtml(draft);
      toast("Static website package exported");
    } catch {
      toast("Unable to export website package");
    }
  };

  return (
    <div className="px-5 py-6 sm:px-8 sm:py-8">
      {/* Breadcrumb + header */}
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center gap-1.5 text-sm text-ink-faint">
          <Link href="/admin/projects" className="hover:text-ink">
            Projects
          </Link>
          <ChevronRight className="size-4" />
          <span className="font-semibold text-ink-soft">
            {isNew ? "New Project" : "Edit Project"}
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            {isNew ? "New Project" : "Edit Project"}
          </h1>
          <div className="flex flex-wrap gap-2.5">
            <Button variant="secondary" onClick={exportHtml}>
              <FileDown className="size-4" />
              Export Website
            </Button>
            <Button variant="secondary" onClick={preview} disabled={!canSave}>
              <Eye className="size-4" />
              Preview
            </Button>
            <Button onClick={save}>
              <Save className="size-4" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 border-b border-line">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative px-3.5 py-2.5 text-sm font-semibold transition sm:px-4 ${
                tab === t.id ? "text-brand" : "text-ink-soft hover:text-ink"
              }`}
            >
              {t.label}
              {tab === t.id && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />
              )}
            </button>
          ))}
        </div>

        {/* Split layout */}
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            {tab === "general" && <GeneralTab draft={draft} patch={patch} />}
            {tab === "appearance" && <AppearanceTab draft={draft} patch={patch} />}
            {tab === "buttons" && <DownloadButtonsTab draft={draft} patch={patch} />}
            {tab === "members" && <MembersTab draft={draft} patch={patch} />}
          </div>

          {/* Live preview */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="mb-3 flex items-center gap-2">
              <Smartphone className="size-4 text-ink-faint" />
              <span className="font-display text-sm font-bold text-ink">Live Preview</span>
            </div>
            <PhonePreview project={draft} />
          </div>
        </div>
      </div>
    </div>
  );
}
