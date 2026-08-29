import { Palette, Blend, Image as ImageIcon } from "lucide-react";
import type { Appearance, Project } from "../../lib/types";
import { gradientLabels } from "../../lib/appearance";
import { Field, inputClass } from "../ui";
import { DropUploader } from "../ImageUploader";
import { Card, OptionCards } from "./parts";

function ColorInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <label className="relative size-11 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-line-strong">
        <span className="block size-full" style={{ background: value }} />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} font-mono uppercase`}
      />
    </div>
  );
}

export function AppearanceTab({
  draft,
  patch,
}: {
  draft: Project;
  patch: (p: Partial<Project>) => void;
}) {
  const a = draft.appearance;
  const setA = (p: Partial<Appearance>) => patch({ appearance: { ...a, ...p } });

  const previewBg =
    a.backgroundType === "solid"
      ? a.solidColor
      : `linear-gradient(135deg, ${a.gradientFrom}, ${a.gradientTo})`;

  return (
    <div className="flex flex-col gap-5">
      <Card
        title="Background"
        desc="Set the backdrop for your public download page."
      >
        <OptionCards
          value={a.backgroundType}
          onChange={(v) => setA({ backgroundType: v })}
          options={[
            { value: "solid", label: "Solid", icon: <Palette className="size-5" /> },
            { value: "gradient", label: "Gradient", icon: <Blend className="size-5" /> },
            { value: "image", label: "Image", icon: <ImageIcon className="size-5" /> },
          ]}
        />

        <div className="mt-5">
          {a.backgroundType === "solid" && (
            <Field label="Background Color">
              <ColorInput value={a.solidColor} onChange={(v) => setA({ solidColor: v })} />
            </Field>
          )}

          {a.backgroundType === "gradient" && (
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Color 1">
                  <ColorInput
                    value={a.gradientFrom}
                    onChange={(v) => setA({ gradientFrom: v })}
                  />
                </Field>
                <Field label="Color 2">
                  <ColorInput
                    value={a.gradientTo}
                    onChange={(v) => setA({ gradientTo: v })}
                  />
                </Field>
              </div>
              <Field label="Gradient Direction">
                <select
                  value={a.gradientDirection}
                  onChange={(e) =>
                    setA({ gradientDirection: e.target.value as Appearance["gradientDirection"] })
                  }
                  className={inputClass}
                >
                  {Object.entries(gradientLabels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </Field>
              <div
                className="h-16 w-full rounded-xl border border-line"
                style={{ background: previewBg }}
              />
            </div>
          )}

          {a.backgroundType === "image" && (
            <div className="flex flex-col gap-4">
              <DropUploader
                value={a.backgroundImage}
                onChange={(v) => setA({ backgroundImage: v })}
              />
              <Field label={`Overlay Strength — ${a.overlayStrength}%`}>
                <input
                  type="range"
                  min={0}
                  max={80}
                  value={a.overlayStrength}
                  onChange={(e) => setA({ overlayStrength: Number(e.target.value) })}
                  className="w-full accent-[var(--color-brand)]"
                />
              </Field>
            </div>
          )}
        </div>
      </Card>

      <Card title="Content Style" desc="Fine-tune how the download card looks.">
        <div className="flex flex-col gap-5">
          <Field label="Text Theme">
            <OptionCards
              value={a.textTheme}
              onChange={(v) => setA({ textTheme: v })}
              options={[
                { value: "auto", label: "Auto" },
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
            />
          </Field>
          <Field label="Download Card Style">
            <OptionCards
              value={a.cardStyle}
              onChange={(v) => setA({ cardStyle: v })}
              options={[
                { value: "solid", label: "Solid" },
                { value: "glass", label: "Glass" },
                { value: "transparent", label: "Transparent" },
              ]}
            />
          </Field>
          <Field label="Card Radius">
            <OptionCards
              value={a.cardRadius}
              onChange={(v) => setA({ cardRadius: v })}
              options={[
                { value: "small", label: "Small" },
                { value: "medium", label: "Medium" },
                { value: "large", label: "Large" },
              ]}
            />
          </Field>
        </div>
      </Card>
    </div>
  );
}
