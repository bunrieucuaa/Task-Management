import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { IProject, IProjectMember } from "@/app/entities/project.entity";
import type { IUserDirectoryItem } from "@/app/entities/user.entity";

interface ProjectMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: IProject | null;
  members: IProjectMember[];
  membersLoading: boolean;
  submitting: boolean;
  /** Whether the current user may add/remove members (ADMIN/PM). */
  manageable: boolean;
  directory: IUserDirectoryItem[];
  onAddMember: (user: IUserDirectoryItem) => Promise<void> | void;
  onRemoveMember: (userId: number) => Promise<void> | void;
}

export default function ProjectMembersDialog({
  open,
  onOpenChange,
  project,
  members,
  membersLoading,
  submitting,
  manageable,
  directory,
  onAddMember,
  onRemoveMember,
}: ProjectMembersDialogProps) {
  const [search, setSearch] = useState("");

  const memberIds = useMemo(() => new Set(members.map((m) => m.userId)), [members]);

  // Available = directory users that are not already members, matching the search.
  const available = useMemo(() => {
    const q = search.trim().toLowerCase();
    return directory.filter((u) => {
      if (memberIds.has(u.id)) {
        return false;
      }
      if (!q) {
        return true;
      }
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });
  }, [directory, memberIds, search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Thành viên — {project?.name ?? ""}</DialogTitle>
          <DialogDescription>
            {manageable
              ? "Trên: thành viên hiện có. Dưới: các user khác trong hệ thống, ấn để thêm."
              : "Danh sách thành viên của project."}
          </DialogDescription>
        </DialogHeader>

        {/* Section 1: current members */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Thành viên hiện có ({members.length})</p>
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {membersLoading ? (
              <p className="text-sm text-muted-foreground">Đang tải thành viên...</p>
            ) : members.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có thành viên nào.</p>
            ) : (
              members.map((member) => {
                const isOwner = member.role === "OWNER";
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{member.user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{member.user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          isOwner ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {member.role}
                      </span>
                      {manageable ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={submitting || isOwner}
                          onClick={() => onRemoveMember(member.userId)}
                          aria-label="Remove member"
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Section 2: remaining users in the system (managers only) */}
        {manageable ? (
        <div className="space-y-2 border-t pt-3">
          <p className="text-sm font-medium">Thêm từ hệ thống</p>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên hoặc email"
          />
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {available.length === 0 ? (
              <p className="text-sm text-muted-foreground">Không còn user nào để thêm.</p>
            ) : (
              available.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email} · {user.role}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={submitting}
                    onClick={() => onAddMember(user)}
                  >
                    <Plus className="size-4" /> Thêm
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
