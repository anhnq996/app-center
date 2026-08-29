"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, KeyRound, Plus, RefreshCw, Search, Trash2, Mail } from "lucide-react";
import { useStore } from "../lib/store";
import { useAuth } from "../lib/auth";
import type { User, UserRole } from "../lib/types";
import {
  Button,
  ConfirmDialog,
  Field,
  Input,
  Modal,
  ModalHeader,
  Segmented,
  useToast,
} from "../components/ui";
import { Avatar, RoleBadge } from "../components/UserBits";

function AddUserModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { addUser, users } = useStore();
  const { provisionUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("editor");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const reset = () => {
    setName("");
    setEmail("");
    setRole("editor");
    setPassword("");
    setShowPassword(false);
  };

  const generatePassword = () => {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*?";
    const values = crypto.getRandomValues(new Uint32Array(16));
    setPassword(Array.from(values, (value) => characters[value % characters.length]).join(""));
    setShowPassword(true);
  };

  const submit = async () => {
    if (!name.trim() || !email.trim() || password.length < 6) return;
    if (users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
      toast("A user with that email already exists");
      return;
    }
    try {
      const userId = await provisionUser(email.trim(), password, name.trim());
      await addUser({ name: name.trim(), email: email.trim(), role, avatar: null }, userId);
      toast("User added");
      reset();
      onClose();
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === "auth/weak-password") {
        toast("Password must have at least 6 characters");
      } else if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
        toast("This email still exists in Firebase Authentication. Enter its previous password to restore the user");
      } else if (code === "auth/invalid-email") {
        toast("Enter a valid email address");
      } else {
        toast("Unable to create or restore the user");
      }
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader
        title="Add User"
        subtitle="Invite a teammate to your workspace."
        onClose={onClose}
      />
      <div className="flex flex-col gap-5 p-6">
        <Field label="Full Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mai Tran" />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="mai@company.com"
          />
        </Field>
        <Field label="Temporary Password">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              className="pr-20"
              minLength={6}
              required
            />
            <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="grid size-8 place-items-center rounded-lg text-ink-faint hover:bg-bg hover:text-ink"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
              <button
                type="button"
                onClick={generatePassword}
                className="grid size-8 place-items-center rounded-lg text-ink-faint hover:bg-bg hover:text-ink"
                aria-label="Generate random password"
                title="Generate random password"
              >
                <RefreshCw className="size-4" />
              </button>
            </div>
          </div>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-faint">
            <KeyRound className="size-3.5" /> Share this password securely with the user.
          </p>
        </Field>
        <Field label="Role">
          <Segmented
            value={role}
            onChange={setRole}
            options={[
              { value: "editor", label: "Editor" },
              { value: "viewer", label: "Viewer" },
            ]}
          />
        </Field>
      </div>
      <div className="flex justify-end gap-2.5 border-t border-line px-6 py-4">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={!name.trim() || !email.trim() || password.length < 6}>
          Add User
        </Button>
      </div>
    </Modal>
  );
}

export default function Users() {
  const { users, deleteUser, currentUser } = useStore();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [toDelete, setToDelete] = useState<User | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [users, query]);

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
            Users
          </h1>
          <p className="mt-1 text-ink-soft">Manage who has access to your workspace.</p>
        </div>
        <Button onClick={() => setAdding(true)} className="h-11" disabled={currentUser.role !== "owner"}>
          <Plus className="size-4" />
          Add User
        </Button>
      </div>

      <div className="relative mt-6">
        <Search className="absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users..."
          className="w-full rounded-xl border border-line-strong bg-surface py-2.5 pl-11 pr-4 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:ring-4 focus:ring-brand/10 sm:max-w-sm"
        />
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-surface">
        {filtered.map((u, i) => (
          <div
            key={u.id}
            className={`flex items-center gap-4 p-4 ${
              i !== filtered.length - 1 ? "border-b border-line" : ""
            }`}
          >
            <Avatar user={u} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-display truncate text-sm font-bold text-ink">{u.name}</p>
                {u.id === currentUser.id && (
                  <span className="rounded-full bg-bg px-1.5 py-0.5 text-[10px] font-semibold text-ink-faint">
                    You
                  </span>
                )}
              </div>
              <p className="flex items-center gap-1.5 truncate text-sm text-ink-soft">
                <Mail className="size-3.5 text-ink-faint" />
                {u.email}
              </p>
            </div>
            <RoleBadge role={u.role} />
            <button
              onClick={() => setToDelete(u)}
              disabled={u.id === currentUser.id}
              className="grid size-9 place-items-center rounded-lg border border-line text-ink-faint transition hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink-faint"
              aria-label="Remove user"
            >
              <Trash2 className="size-[17px]" />
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-ink-soft">No users found.</p>
        )}
      </div>

      <AddUserModal open={adding} onClose={() => setAdding(false)} />
      <ConfirmDialog
        open={!!toDelete}
        title={`Remove "${toDelete?.name}"?`}
        message="This user will lose access to the workspace and be removed from all projects."
        confirmLabel="Remove"
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) {
            try {
              await deleteUser(toDelete.id);
              toast("User removed");
            } catch {
              toast("Unable to remove user from Firestore");
            }
          }
          setToDelete(null);
        }}
      />
    </div>
  );
}
