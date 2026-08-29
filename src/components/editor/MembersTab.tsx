import { useMemo, useState } from "react";
import { Crown, UserPlus, X } from "lucide-react";
import type { Project } from "../../lib/types";
import { useStore } from "../../lib/store";
import {
  Button,
  Field,
  Modal,
  ModalHeader,
  Segmented,
  inputClass,
  useToast,
} from "../ui";
import { Avatar, RoleBadge } from "../UserBits";
import { Card } from "./parts";

type MemberRole = "editor" | "viewer";

export function MembersTab({
  draft,
  patch,
}: {
  draft: Project;
  patch: (p: Partial<Project>) => void;
}) {
  const { users, currentUser } = useStore();
  const toast = useToast();
  const [picking, setPicking] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<MemberRole>("editor");

  const members = useMemo(
    () => draft.memberIds.map((id) => users.find((user) => user.id === id)).filter(Boolean),
    [draft.memberIds, users],
  );
  const available = useMemo(
    () => users.filter((user) => !draft.memberIds.includes(user.id)),
    [users, draft.memberIds],
  );
  const selectedUser = users.find((user) => user.id === selectedUserId);
  const isOwner = draft.ownerId === currentUser.id;

  const chooseUser = (userId: string) => {
    setSelectedUserId(userId);
    const user = users.find((item) => item.id === userId);
    setSelectedRole(user?.role === "viewer" ? "viewer" : "editor");
  };

  const openPicker = () => {
    const first = available[0];
    chooseUser(first?.id ?? "");
    setPicking(true);
  };

  const addMember = () => {
    if (!selectedUser || draft.memberIds.includes(selectedUser.id)) return;
    const role: MemberRole = selectedUser.role === "viewer" ? "viewer" : selectedRole;
    patch({
      memberIds: [...draft.memberIds, selectedUser.id],
      memberRoles: { ...draft.memberRoles, [selectedUser.id]: role },
    });
    toast("Member added");
    setPicking(false);
    setSelectedUserId("");
  };

  const removeMember = (userId: string) => {
    const memberRoles = { ...draft.memberRoles };
    delete memberRoles[userId];
    patch({
      memberIds: draft.memberIds.filter((memberId) => memberId !== userId),
      memberRoles,
    });
  };

  const memberRole = (userId: string, workspaceRole: string): MemberRole =>
    draft.memberRoles?.[userId] ?? (workspaceRole === "viewer" ? "viewer" : "editor");

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
          (member) =>
            member && (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3"
              >
                <Avatar user={member} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-display truncate text-sm font-bold text-ink">
                      {member.name}
                    </p>
                    {member.id === draft.ownerId && (
                      <Crown className="size-3.5 text-amber-500" />
                    )}
                  </div>
                  <p className="truncate text-xs text-ink-soft">{member.email}</p>
                </div>
                <RoleBadge
                  role={
                    member.id === draft.ownerId
                      ? "owner"
                      : memberRole(member.id, member.role)
                  }
                />
                {isOwner && member.id !== draft.ownerId && (
                  <button
                    onClick={() => removeMember(member.id)}
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
          onClick={openPicker}
        >
          <UserPlus className="size-4" />
          Add Member
        </Button>
      )}

      <Modal open={picking} onClose={() => setPicking(false)}>
        <ModalHeader
          title="Add Member"
          subtitle="Select a user from your workspace."
          onClose={() => setPicking(false)}
        />
        <div className="flex flex-col gap-5 p-6">
          {available.length > 0 ? (
            <>
              <Field label="Workspace user">
                <select
                  value={selectedUserId}
                  onChange={(event) => chooseUser(event.target.value)}
                  className={inputClass}
                >
                  {available.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} — {user.email}
                    </option>
                  ))}
                </select>
              </Field>

              {selectedUser && (
                <div className="flex items-center gap-3 rounded-xl border border-line bg-bg p-3">
                  <Avatar user={selectedUser} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{selectedUser.name}</p>
                    <p className="truncate text-xs text-ink-soft">{selectedUser.email}</p>
                  </div>
                  <RoleBadge role={selectedUser.role} />
                </div>
              )}

              <Field
                label="Project role"
                hint={
                  selectedUser?.role === "viewer"
                    ? "A workspace viewer can only be added as a viewer."
                    : "Workspace editors can be added as editor or viewer."
                }
              >
                <Segmented
                  value={selectedRole}
                  onChange={setSelectedRole}
                  options={
                    selectedUser?.role === "viewer"
                      ? [{ value: "viewer", label: "Viewer" }]
                      : [
                          { value: "editor", label: "Editor" },
                          { value: "viewer", label: "Viewer" },
                        ]
                  }
                />
              </Field>
            </>
          ) : (
            <p className="rounded-xl border border-line bg-bg px-4 py-5 text-center text-sm text-ink-soft">
              All workspace users are already members of this project.
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2.5 border-t border-line px-6 py-4">
          <Button variant="secondary" onClick={() => setPicking(false)}>
            Cancel
          </Button>
          <Button onClick={addMember} disabled={!selectedUser}>
            Add Member
          </Button>
        </div>
      </Modal>
    </Card>
  );
}
