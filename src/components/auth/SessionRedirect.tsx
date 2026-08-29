"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth";

export default function SessionRedirect() {
  const router = useRouter();
  const { user, hasAdminAccess, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) router.replace(user && hasAdminAccess ? "/admin/projects" : "/admin/login");
  }, [hasAdminAccess, isLoading, router, user]);

  return <div className="grid min-h-screen place-items-center bg-bg text-sm text-ink-soft">Loading session…</div>;
}
