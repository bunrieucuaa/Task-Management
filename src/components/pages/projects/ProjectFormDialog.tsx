import { useEffect, useMemo, useState } from "react";
import * as z from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { IProject } from "@/app/entities/project.entity";
import type { IUserDirectoryItem } from "@/app/entities/user.entity";

interface ProjectFormValues {
  name: string;
  description: string;
}

export interface ProjectFormSubmit {
  name: string;
  description: string;
  memberIds: number[];
}

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submitting: boolean;
  /** When provided, the dialog is in edit mode. */
  project?: IProject | null;
  /** ACTIVE-user directory for picking initial members (create mode only). */
  directory: IUserDirectoryItem[];
  /** Current user id — excluded from the picker (always added as owner). */
  currentUserId: number;
  onSubmit: (payload: ProjectFormSubmit) => Promise<void> | void;
}

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Tên project không được để trống" })
    .max(255, { message: "Tên project không được vượt quá 255 ký tự" }),
  description: z
    .string()
    .trim()
    .max(5000, { message: "Mô tả không được vượt quá 5000 ký tự" }),
});

export default function ProjectFormDialog({
  open,
  onOpenChange,
  submitting,
  project,
  directory,
  currentUserId,
  onSubmit,
}: ProjectFormDialogProps) {
  const isEdit = Boolean(project);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", description: "" },
  });

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) {
      form.reset({
        name: project?.name ?? "",
        description: project?.description ?? "",
      });
      setSelectedIds([]);
      setSearch("");
    }
  }, [form, open, project]);

  // Pickable users = everyone in the directory except the owner (current user).
  const pickable = useMemo(
    () => directory.filter((u) => u.id !== currentUserId),
    [directory, currentUserId],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return pickable;
    }
    return pickable.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [pickable, search]);

  function toggle(id: number) {
    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((x) => x !== id)
        : [...previous, id],
    );
  }

  async function handleSubmit(data: ProjectFormValues) {
    await onSubmit({
      name: data.name.trim(),
      description: data.description.trim(),
      memberIds: selectedIds,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Cập nhật project" : "Tạo project mới"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Chỉnh sửa thông tin project."
              : "Bạn sẽ là chủ sở hữu. Có thể chọn thêm thành viên ngay khi tạo."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <label className="text-sm font-medium">Tên project</label>
                <Input {...field} placeholder="Website Redesign" />
                {fieldState.error ? (
                  <p className="text-sm text-destructive">{fieldState.error.message}</p>
                ) : null}
              </div>
            )}
          />

          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <label className="text-sm font-medium">Mô tả</label>
                <Textarea {...field} rows={3} placeholder="Mô tả ngắn về project (không bắt buộc)" />
                {fieldState.error ? (
                  <p className="text-sm text-destructive">{fieldState.error.message}</p>
                ) : null}
              </div>
            )}
          />

          {!isEdit ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Thành viên ban đầu</label>
                <span className="text-xs text-muted-foreground">
                  Đã chọn {selectedIds.length}
                </span>
              </div>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm theo tên hoặc email"
              />
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-1">
                {filtered.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-muted-foreground">
                    Không có user phù hợp.
                  </p>
                ) : (
                  filtered.map((u) => (
                    <label
                      key={u.id}
                      className="flex cursor-pointer items-center gap-3 rounded px-2 py-1.5 hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(u.id)}
                        onChange={() => toggle(u.id)}
                        className="size-4"
                      />
                      <div className="min-w-0">
                        <div className="truncate text-sm">{u.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {u.email} · {u.role}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
