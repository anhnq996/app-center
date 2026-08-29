import type { User, UserRole } from "../lib/types";

const palette = [
  "from-indigo-500 to-violet-600",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
];

export function initialsOf(name: string) {
  return (
    name
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

export function Avatar({ user, size = 40 }: { user: User; size?: number }) {
  const hue = palette[user.id.charCodeAt(user.id.length - 1) % palette.length];
  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br ${hue} font-display font-bold text-white`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initialsOf(user.name)}
    </div>
  );
}

const roleStyles: Record<UserRole, string> = {
  owner: "bg-brand-soft text-brand",
  editor: "bg-sky-50 text-sky-600",
  viewer: "bg-ink-faint/12 text-ink-soft",
};

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${roleStyles[role]}`}
    >
      {role}
    </span>
  );
}
