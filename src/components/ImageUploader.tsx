import { useRef, useState, type ReactNode } from "react";
import { LoaderCircle, Upload, Trash2, RefreshCw, ImagePlus } from "lucide-react";
import { uploadProjectImage } from "../lib/storageUploads";
import { Button, useToast } from "./ui";

type ImageReadOptions = {
  maxDimension?: number;
  maxBytes?: number;
};

function canvasToDataUrl(canvas: HTMLCanvasElement, maxBytes: number) {
  const types = ["image/webp", "image/jpeg"];
  for (const type of types) {
    for (const quality of [0.9, 0.82, 0.74, 0.66, 0.58]) {
      const dataUrl = canvas.toDataURL(type, quality);
      if (dataUrl.length <= maxBytes * 1.37 || quality === 0.58) return dataUrl;
    }
  }
  return canvas.toDataURL("image/png");
}

function resizeImage(file: File, options: Required<ImageReadOptions>) {
  return new Promise<string>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    const timeout = window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image processing timed out"));
    }, 15_000);
    img.onload = () => {
      window.clearTimeout(timeout);
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, options.maxDimension / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Unable to process image"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvasToDataUrl(canvas, options.maxBytes));
    };
    img.onerror = () => {
      window.clearTimeout(timeout);
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to read image"));
    };
    img.src = objectUrl;
  });
}

function readFile(
  file: File,
  cb: (dataUrl: string) => void,
  options: ImageReadOptions = {},
) {
  if (file.type.startsWith("image/") && file.type !== "image/svg+xml") {
    resizeImage(file, {
      maxDimension: options.maxDimension ?? 1600,
      maxBytes: options.maxBytes ?? 900_000,
    })
      .then(cb)
      .catch(() => readOriginalFile(file, cb));
    return;
  }
  readOriginalFile(file, cb);
}

function readOriginalFile(file: File, cb: (dataUrl: string) => void) {
  const reader = new FileReader();
  reader.onload = () => cb(reader.result as string);
  reader.readAsDataURL(file);
}

function dataUrlToFile(dataUrl: string, fileName: string) {
  const [meta, base64] = dataUrl.split(",");
  const mime = meta.match(/data:([^;]+)/)?.[1] || "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  const extension = mime.includes("webp") ? "webp" : mime.includes("png") ? "png" : "jpg";
  const outputName = /\.[^.]+$/.test(fileName)
    ? fileName.replace(/\.[^.]+$/, `.${extension}`)
    : `${fileName}.${extension}`;
  return new File([bytes], outputName, { type: mime });
}

async function prepareImageFile(file: File, options: Required<ImageReadOptions>) {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file;
  const dataUrl = await resizeImage(file, options);
  return dataUrlToFile(dataUrl, file.name);
}

/** Compact preview + buttons uploader (used for logos). */
export function LogoUploader({
  value,
  onChange,
  fallback,
  size = 100,
  radius = 20,
  framed = true,
  uploadProjectId,
  uploadSlot = "logo",
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  fallback: ReactNode;
  size?: number;
  radius?: number;
  framed?: boolean;
  uploadProjectId?: string;
  uploadSlot?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();
  const actionLabel = uploading ? "Uploading..." : value ? "Replace" : "Upload";

  const handleFile = async (file: File) => {
    if (uploading) return;
    setUploading(true);
    try {
      if (uploadProjectId) {
        const prepared = await prepareImageFile(file, {
          maxDimension: 768,
          maxBytes: 280_000,
        });
        const url = await uploadProjectImage({
          file: prepared,
          projectId: uploadProjectId,
          slot: uploadSlot,
        });
        onChange(url);
        toast("Logo uploaded");
        return;
      }
      readFile(file, onChange, { maxDimension: 768, maxBytes: 280_000 });
    } catch (error) {
      toast(error instanceof Error ? error.message : "Unable to upload logo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div
        className={`grid shrink-0 place-items-center overflow-hidden ${
          framed ? "border border-line bg-bg" : "bg-transparent"
        }`}
        style={{ width: size, height: size, borderRadius: radius }}
      >
        {value ? (
          <img
            src={value}
            alt="Logo preview"
            className="max-h-full max-w-full object-contain p-2"
          />
        ) : (
          fallback
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = "";
          }}
        />
        <Button
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <span className="grid size-4 shrink-0 place-items-center">
            {uploading ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : value ? (
              <RefreshCw className="size-4" />
            ) : (
              <Upload className="size-4" />
            )}
          </span>
          <span>{actionLabel}</span>
        </Button>
        {value && (
          <Button variant="ghost" onClick={() => onChange(null)} disabled={uploading}>
            <Trash2 className="size-4" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}

/** Large drag-and-drop area (used for background images). */
export function DropUploader({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) readFile(f, onChange, { maxDimension: 1920, maxBytes: 900_000 });
            e.target.value = "";
          }}
      />
      {value ? (
        <div className="overflow-hidden rounded-2xl border border-line">
          <div className="h-44 w-full bg-bg">
            <img src={value} alt="Background preview" className="size-full object-cover" />
          </div>
          <div className="flex gap-2 border-t border-line bg-surface p-3">
            <Button variant="secondary" onClick={() => inputRef.current?.click()}>
              <RefreshCw className="size-4" />
              Replace Image
            </Button>
            <Button variant="ghost" onClick={() => onChange(null)}>
              <Trash2 className="size-4" />
              Remove Image
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) readFile(f, onChange, { maxDimension: 1920, maxBytes: 900_000 });
          }}
          className="flex h-44 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line-strong bg-bg text-ink-soft transition hover:border-brand hover:bg-brand-soft/40"
        >
          <ImagePlus className="size-7 text-ink-faint" />
          <span className="text-sm font-semibold text-ink">
            Drag &amp; drop an image
          </span>
          <span className="text-xs text-ink-faint">or click to browse</span>
        </button>
      )}
    </div>
  );
}
