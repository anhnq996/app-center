import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Check, X, AlertTriangle } from "lucide-react";

/* ---------- Toast ---------- */

interface ToastItem {
  id: number;
  message: string;
}
const ToastContext = createContext<(msg: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const push = useCallback((message: string) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{ animation: "toast-in 0.28s cubic-bezier(0.16,1,0.3,1)" }}
            className="flex items-center gap-2.5 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-[0_10px_40px_-8px_rgba(15,23,41,0.55)]"
          >
            <span className="grid size-5 place-items-center rounded-full bg-success/90">
              <Check className="size-3 text-white" strokeWidth={3} />
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);

/* ---------- Button ---------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
const buttonStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-strong shadow-[0_1px_2px_rgba(79,70,229,0.4)]",
  secondary:
    "bg-surface text-ink border border-line-strong hover:border-ink-faint hover:bg-bg",
  ghost: "text-ink-soft hover:bg-bg hover:text-ink",
  danger: "bg-danger text-white hover:brightness-95",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: {
  variant?: ButtonVariant;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${buttonStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

/* ---------- Text field ---------- */

export function Field({
  label,
  hint,
  children,
}: {
  label?: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      )}
      {children}
      {hint && <span className="mt-1.5 block text-xs text-ink-faint">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:ring-4 focus:ring-brand/10";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

/* ---------- Toggle ---------- */

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
        checked ? "bg-brand" : "bg-line-strong"
      }`}
    >
      <span
        className={`inline-block size-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

/* ---------- Segmented control ---------- */

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode }[];
}) {
  return (
    <div className="inline-flex w-full rounded-xl border border-line bg-bg p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-150 ${
            value === o.value
              ? "bg-surface text-ink shadow-sm"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Modal ---------- */

export function Modal({
  open,
  onClose,
  children,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        style={{ animation: "overlay-in 0.2s ease" }}
        onClick={onClose}
      />
      <div
        style={{ animation: "panel-in 0.28s cubic-bezier(0.16,1,0.3,1)" }}
        className={`relative w-full max-h-[92vh] overflow-y-auto rounded-t-3xl bg-surface shadow-2xl sm:max-w-lg sm:rounded-3xl ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

/* ---------- Confirm dialog ---------- */

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} className="sm:max-w-md">
      <div className="p-6">
        <div className="mb-4 grid size-11 place-items-center rounded-full bg-danger/10">
          <AlertTriangle className="size-5 text-danger" />
        </div>
        <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{message}</p>
        <div className="mt-6 flex justify-end gap-2.5">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Modal header ---------- */

export function ModalHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between border-b border-line px-6 py-5">
      <div>
        <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-ink-soft">{subtitle}</p>}
      </div>
      <button
        onClick={onClose}
        className="grid size-9 place-items-center rounded-lg text-ink-faint transition hover:bg-bg hover:text-ink"
      >
        <X className="size-5" />
      </button>
    </div>
  );
}

/* ---------- Status badge ---------- */

export function StatusBadge({ status }: { status: "active" | "inactive" }) {
  const active = status === "active";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        active ? "bg-success/10 text-success" : "bg-ink-faint/12 text-ink-faint"
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${active ? "bg-success" : "bg-ink-faint"}`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}
