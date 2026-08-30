import { useEffect, useState } from "react"
import {
  FileArchive,
  FileCheck2,
  FileUp,
  History,
  LinkIcon,
  LoaderCircle,
  RotateCcw,
} from "lucide-react"
import type { Platform, PlatformVersion } from "../../lib/types"
import {
  Button,
  Field,
  Input,
  Modal,
  ModalHeader,
  Segmented,
  Toggle,
  useToast,
} from "../ui"
import { LogoUploader } from "../ImageUploader"
import { PlatformGlyph } from "../PlatformGlyph"
import { uid } from "../../lib/data"
import { auth } from "../../lib/firebase"
import { isIosOtaPlatform } from "../../lib/platformLinks"
import { MAX_VERSIONS } from "../../lib/versioning"

function relTime(iso: string) {
  const date = new Date(iso)
  const days = Math.floor((Date.now() - date.getTime()) / 86400000)
  if (days <= 0) return "today"
  if (days === 1) return "yesterday"
  if (days < 30) return `${days}d ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function PlatformEditorModal({
  open,
  platform,
  mode,
  projectSlug,
  projectId,
  onClose,
  onSave,
}: {
  open: boolean
  platform: Platform | null
  mode: "edit" | "add"
  projectSlug: string
  projectId: string
  onClose: () => void
  onSave: (platform: Platform) => void
}) {
  const [draft, setDraft] = useState<Platform | null>(platform)
  const [uploading, setUploading] = useState(false)
  const [ipaFile, setIpaFile] = useState<File | null>(null)
  const toast = useToast()

  useEffect(() => {
    setDraft(
      platform ?? {
        id: uid("plat"),
        kind: "custom",
        name: "",
        logo: null,
        source: "link",
        linkBehavior: "download",
        iosOta: false,
        url: "",
        fileName: null,
        fileSize: null,
        ipaUrl: null,
        manifestFileName: null,
        label: "",
        subtitle: "",
        version: "1.0.0",
        active: true,
        history: [],
      },
    )
    setIpaFile(null)
    setUploading(false)
  }, [platform, open])

  if (!draft) return null
  const set = <K extends keyof Platform>(key: K, value: Platform[K]) =>
    setDraft((current) => (current ? { ...current, [key]: value } : current))
  const isBuiltIn = draft.kind !== "custom"
  const iosOtaEnabled = isIosOtaPlatform(draft)

  const uploadRequest = async (formData: FormData) => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(projectSlug)) {
      throw new Error(
        "Enter and save a valid project slug before uploading files",
      )
    }
    const currentUser = auth?.currentUser
    if (!currentUser) throw new Error("You must be signed in to upload files")
    formData.set("platformId", draft.id)
    const response = await fetch(
      `/api/uploads/${encodeURIComponent(projectSlug)}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${await currentUser.getIdToken()}` },
        body: formData,
      },
    )
    const result = (await response.json().catch(() => null)) as {
      error?: string
      url?: string
      ipaUrl?: string
      fileName?: string
      fileSize?: string
      manifestFileName?: string
    } | null
    if (!response.ok || !result)
      throw new Error(result?.error || "Unable to upload file")
    return result
  }

  const uploadDirectFile = async (file: File) => {
    if (draft.kind === "android" && !file.name.toLowerCase().endsWith(".apk")) {
      toast("Android files must use the .apk extension")
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.set("mode", "direct")
      formData.set("file", file)
      const result = await uploadRequest(formData)
      setDraft((current) =>
        current
          ? {
              ...current,
              url: result.url ?? "",
              linkBehavior: "download",
              iosOta: false,
              fileName: result.fileName ?? file.name,
              fileSize: result.fileSize ?? formatFileSize(file.size),
            }
          : current,
      )
      toast("File uploaded")
    } catch (error) {
      toast(error instanceof Error ? error.message : "Unable to upload file")
    } finally {
      setUploading(false)
    }
  }

  const uploadIosPackage = async () => {
    if (!ipaFile) return
    if (!ipaFile.name.toLowerCase().endsWith(".ipa")) {
      toast("Select a valid .ipa file")
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.set("mode", "ios")
      formData.set("ipa", ipaFile)
      formData.set("name", draft.name)
      formData.set("version", draft.version)
      const result = await uploadRequest(formData)
      setDraft((current) =>
        current
          ? {
              ...current,
              url: result.url ?? "",
              ipaUrl: result.ipaUrl ?? null,
              linkBehavior: "ios-manifest",
              iosOta: true,
              fileName: result.fileName ?? ipaFile.name,
              fileSize: result.fileSize ?? formatFileSize(ipaFile.size),
              manifestFileName: result.manifestFileName ?? "manifest.plist",
            }
          : current,
      )
      toast("IPA uploaded and plist generated")
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Unable to upload iOS package",
      )
    } finally {
      setUploading(false)
    }
  }

  const rollback = (version: PlatformVersion) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            version: version.version,
            source: version.source,
            linkBehavior: version.linkBehavior,
            iosOta: version.iosOta,
            url: version.url,
            ipaUrl: version.ipaUrl,
            manifestFileName: version.manifestFileName,
            fileName: version.fileName,
            fileSize: version.fileSize,
            label: version.label,
            subtitle: version.subtitle,
          }
        : current,
    )
    toast(`Restored v${version.version} — Save to apply`)
  }

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader
        title={
          mode === "add"
            ? "Add Download Button"
            : `Edit ${draft.name || "Platform"}`
        }
        subtitle="Configure how this platform appears and downloads."
        onClose={onClose}
      />
      <div className="flex flex-col gap-5 p-6">
        <div className="flex items-end gap-4">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-ink text-white">
            <PlatformGlyph platform={draft} className="size-7" />
          </div>
          <div className="flex-1">
            <Field label="Platform Name">
              <Input
                value={draft.name}
                onChange={(event) => set("name", event.target.value)}
                placeholder="e.g. Windows"
                disabled={isBuiltIn}
              />
            </Field>
          </div>
        </div>

        {draft.kind === "custom" && (
          <Field
            label="Platform Logo"
            hint="Square image works best (PNG or SVG)."
          >
            <LogoUploader
              value={draft.logo}
              onChange={(value) => set("logo", value)}
              uploadProjectId={projectId}
              uploadSlot={`platform-${draft.id}-logo`}
              size={64}
              radius={16}
              fallback={
                <PlatformGlyph
                  platform={draft}
                  className="size-6 text-ink-faint"
                />
              }
            />
          </Field>
        )}

        <Field label="Download Source">
          <Segmented
            value={draft.source}
            onChange={(value) =>
              setDraft((current) =>
                current && current.source !== value
                  ? {
                      ...current,
                      source: value,
                      url: "",
                      ipaUrl: null,
                      fileName: null,
                      fileSize: null,
                      manifestFileName: null,
                      linkBehavior: current.iosOta
                        ? "ios-manifest"
                        : "download",
                    }
                  : current,
              )
            }
            options={[
              { value: "file", label: "Upload file" },
              { value: "link", label: "External link" },
            ]}
          />
        </Field>

        <div className="flex items-center justify-between rounded-xl border border-line bg-bg px-4 py-3">
          <div className="pr-4">
            <p className="text-sm font-semibold text-ink">
              iOS OTA installation
            </p>
            <p className="text-xs leading-relaxed text-ink-faint">
              Enable only when this button installs an iOS app through an IPA
              and plist manifest.
            </p>
          </div>
          <Toggle
            checked={iosOtaEnabled}
            onChange={(value) =>
              setDraft((current) =>
                current
                  ? {
                      ...current,
                      iosOta: value,
                      linkBehavior: value ? "ios-manifest" : "download",
                    }
                  : current,
              )
            }
          />
        </div>

        {draft.source === "file" ? (
          iosOtaEnabled ? (
            <div className="flex flex-col gap-4">
              <Field
                label="IPA file"
                hint="The server will generate the OTA manifest plist automatically."
              >
                <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line-strong bg-bg px-3 text-center transition hover:border-brand hover:text-brand">
                  <FileUp className="mb-1 size-5" />
                  <span className="max-w-full truncate text-sm font-semibold">
                    {ipaFile?.name || draft.fileName || "Choose .ipa"}
                  </span>
                  <input
                    type="file"
                    accept=".ipa,application/octet-stream"
                    className="hidden"
                    onChange={(event) =>
                      setIpaFile(event.target.files?.[0] ?? null)
                    }
                  />
                </label>
              </Field>
              <Button
                variant="secondary"
                onClick={uploadIosPackage}
                disabled={!ipaFile || uploading}
              >
                {uploading ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <FileUp className="size-4" />
                )}
                Upload IPA
              </Button>
              <p className="text-xs leading-relaxed text-ink-faint">
                The generated plist will reference the uploaded IPA and use
                metadata from the app bundle.
              </p>
            </div>
          ) : (
            <Field
              label={draft.kind === "android" ? "Upload APK" : "Upload File"}
            >
              {draft.fileName && draft.url ? (
                <div className="flex items-center gap-3 rounded-xl border border-line bg-bg px-3.5 py-3">
                  <FileCheck2 className="size-5 text-success" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {draft.fileName}
                    </p>
                    <p className="text-xs text-ink-faint">{draft.fileSize}</p>
                  </div>
                  <label className="cursor-pointer text-xs font-semibold text-ink-soft hover:text-brand">
                    Replace
                    <input
                      type="file"
                      accept={
                        draft.kind === "android"
                          ? ".apk,application/vnd.android.package-archive"
                          : undefined
                      }
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) void uploadDirectFile(file)
                      }}
                    />
                  </label>
                </div>
              ) : (
                <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line-strong bg-bg py-6 text-sm font-semibold text-ink-soft transition hover:border-brand hover:text-brand">
                  {uploading ? (
                    <LoaderCircle className="size-5 animate-spin" />
                  ) : (
                    <FileUp className="size-5" />
                  )}
                  {uploading ? "Uploading..." : "Choose file to upload"}
                  <input
                    type="file"
                    accept={
                      draft.kind === "android"
                        ? ".apk,application/vnd.android.package-archive"
                        : undefined
                    }
                    className="hidden"
                    disabled={uploading}
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) void uploadDirectFile(file)
                    }}
                  />
                </label>
              )}
            </Field>
          )
        ) : (
          <Field
            label={iosOtaEnabled ? "Manifest plist URL" : "External URL"}
            hint={
              iosOtaEnabled
                ? "Enter the public HTTPS plist URL. The special itms-services install link is generated automatically."
                : "Enter a store page or any external file URL. The server response decides whether it opens or downloads."
            }
          >
            <Input
              value={draft.url}
              onChange={(event) => set("url", event.target.value)}
              placeholder={
                iosOtaEnabled
                  ? "https://downloads.example.com/manifest.plist"
                  : "https://..."
              }
            />
          </Field>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Version"
            hint="Changing this snapshots the previous version."
          >
            <Input
              value={draft.version}
              onChange={(event) => set("version", event.target.value)}
              placeholder="2.1.0"
              className="font-mono"
            />
          </Field>
          <Field label="Subtitle">
            <Input
              value={draft.subtitle}
              onChange={(event) => set("subtitle", event.target.value)}
              placeholder="Windows 10 or later"
            />
          </Field>
        </div>

        <Field label="Button Label">
          <Input
            value={draft.label}
            onChange={(event) => set("label", event.target.value)}
            placeholder="Tải xuống cho Windows"
          />
        </Field>

        {draft.history.length > 0 && (
          <div className="rounded-xl border border-line bg-bg p-4">
            <div className="mb-3 flex items-center gap-2">
              <History className="size-4 text-ink-soft" />
              <span className="text-sm font-semibold text-ink">
                Version history
              </span>
              <span className="text-xs text-ink-faint">
                (last {MAX_VERSIONS} kept)
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {draft.history.map((version) => (
                <div
                  key={version.id}
                  className="flex items-center gap-3 rounded-lg border border-line bg-surface p-2.5"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-bg text-ink-soft">
                    {version.source === "file" ? (
                      <FileArchive className="size-4" />
                    ) : (
                      <LinkIcon className="size-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      <span className="font-mono">v{version.version}</span>
                      {version.fileName && (
                        <span className="ml-2 text-xs font-normal text-ink-faint">
                          {version.fileName} · {version.fileSize}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-ink-faint">
                      Saved {relTime(version.savedAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => rollback(version)}
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
            <p className="text-xs text-ink-faint">
              Show this button on the public page.
            </p>
          </div>
          <Toggle
            checked={draft.active}
            onChange={(value) => set("active", value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2.5 border-t border-line px-6 py-4">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={() => onSave(draft)}
          disabled={!draft.name.trim() || !draft.url.trim() || uploading}
        >
          {mode === "add" ? "Add Platform" : "Save"}
        </Button>
      </div>
    </Modal>
  )
}
