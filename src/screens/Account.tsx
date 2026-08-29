"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, UserCircle } from "lucide-react";
import { Button, Field, Input, Toggle, useToast } from "../components/ui";
import { Card } from "../components/editor/parts";
import { useAuth } from "../lib/auth";

export default function Account() {
  const toast = useToast();
  const { changePassword } = useAuth();
  const [name, setName] = useState("Alex Morgan");
  const [email, setEmail] = useState("admin@gosang.com");
  const [emails, setEmails] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const submitPasswordChange = async () => {
    if (!currentPassword || newPassword.length < 6) {
      toast("New password must have at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast("New password confirmation does not match");
      return;
    }
    setChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast("Password updated");
    } catch {
      toast("Unable to update password. Check your current password and try again.");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
        Account
      </h1>
      <p className="mt-1 text-ink-soft">Manage your profile and preferences.</p>

      <div className="mt-6 flex flex-col gap-5">
        <Card title="Profile">
          <div className="mb-5 flex items-center gap-4">
            <div className="grid size-16 place-items-center rounded-full bg-brand-soft text-brand">
              <UserCircle className="size-9" />
            </div>
            <div>
              <p className="font-display font-bold text-ink">{name}</p>
              <p className="text-sm text-ink-soft">{email}</p>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full Name">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Email">
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
          </div>
        </Card>

        <Card title="Preferences">
          <div className="flex items-center justify-between rounded-xl border border-line bg-bg px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-ink">Email notifications</p>
              <p className="text-xs text-ink-faint">
                Get notified about download activity.
              </p>
            </div>
            <Toggle checked={emails} onChange={setEmails} />
          </div>
        </Card>

        <Card title="Password" desc="Use your current password to confirm this security change.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Current Password">
              <div className="relative">
                <Input
                  type={showPasswords ? "text" : "password"}
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords((visible) => !visible)}
                  className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-ink-faint hover:bg-bg hover:text-ink"
                  aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
                >
                  {showPasswords ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>
            <Field label="New Password">
              <Input
                type={showPasswords ? "text" : "password"}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={6}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirm New Password">
              <Input
                type={showPasswords ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={6}
                autoComplete="new-password"
              />
            </Field>
          </div>
          <div className="mt-5 flex justify-end">
            <Button
              variant="secondary"
              onClick={submitPasswordChange}
              disabled={changingPassword || !currentPassword || newPassword.length < 6 || !confirmPassword}
            >
              <LockKeyhole className="size-4" />
              {changingPassword ? "Updating…" : "Update Password"}
            </Button>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button onClick={() => toast("Account updated")}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
