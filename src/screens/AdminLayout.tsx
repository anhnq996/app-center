"use client";

import {
  Boxes,
  LayoutGrid,
  LogOut,
  Menu,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../lib/auth";

const nav = [
  { to: "/admin/projects", label: "Projects", icon: LayoutGrid },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/account", label: "Account", icon: UserCircle },
];

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { signOutUser } = useAuth();
  return (
    <div className="flex h-full flex-col">
      <Link
        href="/admin/projects"
        onClick={onNavigate}
        className="flex items-center gap-2.5 px-5 py-6"
      >
        <div className="grid size-9 place-items-center rounded-xl bg-brand text-white">
          <Boxes className="size-5" />
        </div>
        <span className="font-display text-[15px] font-extrabold tracking-tight text-ink">
          App Centers
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {nav.map((item) => (
          <Link
            key={item.to}
            href={item.to}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              pathname === item.to
                ? "bg-brand-soft text-brand"
                : "text-ink-soft hover:bg-bg hover:text-ink"
            }`}
          >
            <item.icon className="size-[18px]" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-3">
        <button
          onClick={async () => {
            onNavigate?.();
            await signOutUser();
            router.push("/admin/login");
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-soft transition hover:bg-danger/10 hover:text-danger"
        >
          <LogOut className="size-[18px]" />
          Logout
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [drawer, setDrawer] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, hasAdminAccess, isLoading } = useAuth();

  useEffect(() => {
    if (pathname !== "/admin/login" && !isLoading && (!user || !hasAdminAccess)) {
      router.replace("/admin/login");
    }
  }, [hasAdminAccess, isLoading, pathname, router, user]);

  if (pathname === "/admin/login") return <>{children}</>;
  if (isLoading) {
    return <div className="grid min-h-screen place-items-center bg-bg text-sm text-ink-soft">Loading session…</div>;
  }
  if (!user || !hasAdminAccess) return null;

  return (
    <div className="min-h-screen bg-bg">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-surface lg:block">
        <SidebarBody />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-lg bg-brand text-white">
            <Boxes className="size-[18px]" />
          </div>
          <span className="font-display text-sm font-extrabold text-ink">
            App Centers
          </span>
        </div>
        <button
          onClick={() => setDrawer(true)}
          className="grid size-9 place-items-center rounded-lg text-ink-soft hover:bg-bg"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            style={{ animation: "overlay-in 0.2s ease" }}
            onClick={() => setDrawer(false)}
          />
          <div
            className="absolute inset-y-0 left-0 w-72 bg-surface shadow-2xl"
            style={{ animation: "drawer-in 0.28s cubic-bezier(0.16,1,0.3,1)" }}
          >
            <button
              onClick={() => setDrawer(false)}
              className="absolute right-3 top-5 grid size-8 place-items-center rounded-lg text-ink-faint hover:bg-bg"
            >
              <X className="size-5" />
            </button>
            <SidebarBody onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      )}

      <main className="lg:pl-64">
        {children}
      </main>
    </div>
  );
}
