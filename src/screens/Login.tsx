"use client";

import { ArrowRight, Boxes, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Field, Input } from "../components/ui";
import { useAuth } from "../lib/auth";

export default function Login() {
  const router = useRouter();
  const { user, hasAdminAccess, isLoading, signIn, signOutUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && user && hasAdminAccess) router.replace("/admin/projects");
  }, [hasAdminAccess, isLoading, router, user]);

  return (
    <div className="grid min-h-screen place-items-center bg-bg px-4">
      <div className="w-full max-w-[400px]">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            try {
              await signIn(email, password, remember);
            } catch {
              setError("Email or password is incorrect, or Firebase Authentication is not configured.");
            }
          }}
          className="rounded-[20px] border border-line bg-surface p-8 shadow-[0_24px_60px_-24px_rgba(15,23,41,0.2)]"
        >
          <div className="mb-7 flex flex-col items-center text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-brand text-white shadow-[0_8px_20px_-6px_rgba(79,70,229,0.6)]">
              <Boxes className="size-6" />
            </div>
            <h1 className="font-display mt-5 text-2xl font-extrabold tracking-tight text-ink">
              Admin Login
            </h1>
            <p className="mt-1.5 text-sm text-ink-soft">
              Sign in to manage your App Center pages
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </Field>
            <Field label="Password">
              <div className="relative">
                <Input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-ink-faint transition hover:bg-bg hover:text-ink"
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>

            <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="size-4 rounded border-line-strong text-brand accent-[var(--color-brand)]"
              />
              Remember me
            </label>

            <Button type="submit" className="mt-1 h-11 w-full">
              Log in
              <ArrowRight className="size-4" />
            </Button>
            {error && <p className="text-center text-xs text-danger">{error}</p>}
            {!isLoading && user && !hasAdminAccess && (
              <div className="rounded-xl border border-danger/20 bg-danger/5 p-3 text-center text-xs text-danger">
                This account does not have administrator access.
                <button type="button" onClick={() => void signOutUser()} className="ml-1 font-bold underline">
                  Sign out
                </button>
              </div>
            )}
          </div>
        </form>
        <p className="mt-5 text-center text-xs text-ink-faint">
          Sign in with an administrator account from Firebase Authentication.
        </p>
      </div>
    </div>
  );
}
