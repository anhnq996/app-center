import { useMemo, useState } from "react";
import { UserPlus, X, Crown, Check } from "lucide-react";
import type { Project } from "../../lib/types";
import { useStore } from "../../lib/store";
import {
  Button,
  Field,
  Input,
  Modal,
  ModalHeader,
  Segmented,
  useToast,
} from "../ui";
import { Avatar, RoleBadge } from "../UserBits";
import { Card } from "./parts";
import type { UserRole } from "../../lib/types";

export function MembersTab({
  draft,
  patch,
}: {
  draft: Project;
  patch: (p: Partial<Project>) => void;
}) {
  const { users, addUser, currentUser } = useStore();
  const toast = useToast();
  const [picking, setPicking] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("editor");

  const members = useMemo(
    () => draft.memberIds.map((id) => users.find((u) => u.id === id)).filter(Boolean),
    [draft.memberIds, users],
  );
  const available = useMemo(
    () => users.filter((u) => !draft.memberIds.includes(u.id)),
    [users, draft.memberIds],
  );

  const isOwner = draft.ownerId === currentUser.id;

  const addMember = (id: string) =>
    patch({ memberIds: [...draft.memberIds, id] });
  const removeMember = (id: string) =>
    patch({ memberIds: draft.memberIds.filter((m) => m !== id) });

  const invite = async () => {
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    const existing = users.find(
      (u) => u.email.toLowerCase() === inviteEmail.trim().toLowerCase(),
    );
    try {
      const user =
        existing ??
        (await addUser({
          name: inviteName.trim(),
          email: inviteEmail.trim(),
          role: inviteRole,
          avatar: null,
        }));
      if (!draft.memberIds.includes(user.id)) addMember(user.id);
      toast(existing ? "Member added" : "Invitation sent");
      setInviteName("");
      setInviteEmail("");
      setPicking(false);
    } catch {
      toast("Unable to add user to Firestore");
    }
  };

  return (
    <Card
      title="Project Members"
      desc="People who can access and manage this download page."
    >
      {!isOwner && (
        <p className="mb-4 rounded-xl border border-line bg-bg px-4 py-3 text-xs text-ink-soft">
          Only the project owner can add or remove members.
        </p>
      )}

      <div className="flex flex-col gap-2.5">
        {members.map(
          (m) =>
            m && (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3"
              >
                <Avatar user={m} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-display truncate text-sm font-bold text-ink">
                      {m.name}
                    </p>
                    {m.id === draft.ownerId && (
                      <Crown className="size-3.5 text-amber-500" />
                    )}
                  </div>
                  <p className="truncate text-xs text-ink-soft">{m.email}</p>
                </div>
                {m.id === draft.ownerId ? (
                  <RoleBadge role="owner" />
                ) : (
                  <RoleBadge role={m.role} />
                )}
                {isOwner && m.id !== draft.ownerId && (
                  <button
                    onClick={() => removeMember(m.id)}
                    className="grid size-9 place-items-center rounded-lg border border-line text-ink-faint transition hover:bg-danger/10 hover:text-danger"
                    aria-label="Remove member"
                  >
                    <X className="size-[17px]" />
                  </button>
                )}
              </div>
            ),
        )}
      </div>

      {isOwner && (
        <Button
          variant="secondary"
          className="mt-4 w-full border-dashed"
          onClick={() => setPicking(true)}
        >
          <UserPlus className="size-4" />
          Add Member
        </Button>
      )}

      <Modal open={picking} onClose={() => setPicking(false)}>
        <ModalHeader
          title="Add Member"
          subtitle="Add an existing user or invite someone new."
          onClose={() => setPicking(false)}
        />
        <div className="flex flex-col gap-5 p-6">
          {available.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-ink">Workspace users</p>
              <div className="flex flex-col gap-2">
                {available.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      addMember(u.id);
                      toast("Member added");
                    }}
                    className="group flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5 text-left transition hover:border-brand hover:bg-brand-soft/40"
                  >
                    <Avatar user={u} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{u.name}</p>
                      <p className="truncate text-xs text-ink-soft">{u.email}</p>
                    </div>
                    <span className="grid size-7 place-items-center rounded-lg bg-bg text-ink-faint transition group-hover:bg-brand group-hover:text-white">
                      <Check className="size-4" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-line pt-5">
            <p className="mb-3 text-sm font-semibold text-ink">Invite by email</p>
            <div className="flex flex-col gap-4">
              <Field label="Full Name">
                <Input
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Jordan Kim"
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="jordan@company.com"
                />
              </Field>
              <Field label="Role">
                <Segmented
                  value={inviteRole}
                  onChange={setInviteRole}
                  options={[
                    { value: "editor", label: "Editor" },
                    { value: "viewer", label: "Viewer" },
                  ]}
                />
              </Field>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2.5 border-t border-line px-6 py-4">
          <Button variant="secondary" onClick={() => setPicking(false)}>
            Cancel
          </Button>
          <Button onClick={invite} disabled={!inviteName.trim() || !inviteEmail.trim()}>
            Send Invite
          </Button>
        </div>
      </Modal>
    </Card>
  );
}
