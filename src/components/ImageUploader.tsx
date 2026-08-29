import { useRef, type ReactNode } from "react";
import { Upload, Trash2, RefreshCw, ImagePlus } from "lucide-react";
import { Button } from "./ui";

function readFile(file: File, cb: (dataUrl: string) => void) {
  const reader = new FileReader();
  reader.onload = () => cb(reader.result as string);
  reader.readAsDataURL(file);
}

/** Compact preview + buttons uploader (used for logos). */
export function LogoUploader({
  value,
  onChange,
  fallback,
  size = 100,
  radius = 20,
  framed = true,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  fallback: ReactNode;
  size?: number;
  radius?: number;
  framed?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
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
            if (f) readFile(f, onChange);
            e.target.value = "";
          }}
        />
        <Button variant="secondary" onClick={() => inputRef.current?.click()}>
          {value ? <RefreshCw className="size-4" /> : <Upload className="size-4" />}
          {value ? "Replace" : "Upload"}
        </Button>
        {value && (
          <Button variant="ghost" onClick={() => onChange(null)}>
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
          if (f) readFile(f, onChange);
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
            if (f) readFile(f, onChange);
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
