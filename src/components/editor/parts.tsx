import type { ReactNode } from "react";

export function Card({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="mb-5">
        <h3 className="font-display text-base font-bold text-ink">{title}</h3>
        {desc && <p className="mt-0.5 text-sm text-ink-soft">{desc}</p>}
      </div>
      {children}
    </section>
  );
}

export function OptionCards<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: ReactNode }[];
}) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3.5 text-sm font-semibold transition ${
            value === o.value
              ? "border-brand bg-brand-soft text-brand ring-2 ring-brand/15"
              : "border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink"
          }`}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}
