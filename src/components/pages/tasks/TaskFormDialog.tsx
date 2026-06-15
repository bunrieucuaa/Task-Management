import { useEffect } from "react";
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
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AppSelect } from "@/components/ui/app-select";
import { DatePicker } from "@/components/ui/date-picker";
import type { ITask } from "@/app/entities/task.entity";
import type { IProject, IProjectMember } from "@/app/entities/project.entity";
import { ETaskPriority, TASK_PRIORITY_LABELS } from "@/app/shared/enums/ETaskPriority";

export interface TaskFormSubmit {
  projectId: number;
  title: string;
  description: string;
  assigneeId: number | null;
  priority: ETaskPriority;
  deadline: string | null;
}

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submitting: boolean;
  task?: ITask | null;
  /** Preselected project when creating from a filtered view. */
  defaultProjectId?: number | null;
  projects: IProject[];
  members: IProjectMember[];
  /** Ask the parent to load the members of a project (for the assignee picker). */
  onProjectChange: (projectId: number | null) => void;
  onSubmit: (payload: TaskFormSubmit) => Promise<void> | void;
}

/** Sentinel for the "unassigned" option (Radix Select forbids value=""). */
const UNASSIGNED = "NONE";

interface TaskFormValues {
  projectId: string;
  title: string;
  description: string;
  assigneeId: string;
  priority: ETaskPriority;
  deadline: string;
}

const formSchema = z.object({
  projectId: z.string().min(1, { message: "Vui lòng chọn project" }),
  title: z
    .string()
    .trim()
    .min(1, { message: "Tiêu đề không được để trống" })
    .max(255, { message: "Tiêu đề không được vượt quá 255 ký tự" }),
  description: z.string().max(5000, { message: "Mô tả quá dài" }),
  assigneeId: z.string(),
  priority: z.nativeEnum(ETaskPriority),
  deadline: z.string(),
});

export default function TaskFormDialog({
  open,
  onOpenChange,
  submitting,
  task,
  defaultProjectId,
  projects,
  members,
  onProjectChange,
  onSubmit,
}: TaskFormDialogProps) {
  const isEdit = Boolean(task);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: "",
      title: "",
      description: "",
      assigneeId: "",
      priority: ETaskPriority.Medium,
      deadline: "",
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    const projectId = task?.projectId ?? defaultProjectId ?? null;
    form.reset({
      projectId: projectId ? String(projectId) : "",
      title: task?.title ?? "",
      description: task?.description ?? "",
      assigneeId: task?.assigneeId ? String(task.assigneeId) : "",
      priority: task?.priority ?? ETaskPriority.Medium,
      deadline: task?.deadline ? task.deadline.slice(0, 10) : "",
    });
    // Load members for the assignee picker of the initial project.
    onProjectChange(projectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task, defaultProjectId]);

  async function handleSubmit(data: TaskFormValues) {
    await onSubmit({
      projectId: Number(data.projectId),
      title: data.title.trim(),
      description: data.description.trim(),
      assigneeId: data.assigneeId ? Number(data.assigneeId) : null,
      priority: data.priority,
      deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Cập nhật task" : "Tạo task mới"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Chỉnh sửa thông tin công việc."
              : "Tạo công việc trong một project. Người được giao phải là thành viên của project."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
          <Controller
            name="projectId"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <label className="text-sm font-medium">Project</label>
                <AppSelect
                  className="w-full"
                  value={field.value}
                  disabled={isEdit}
                  placeholder="— Chọn project —"
                  onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue("assigneeId", "");
                    onProjectChange(value ? Number(value) : null);
                  }}
                  options={projects.map((project) => ({
                    value: String(project.id),
                    label: project.name,
                  }))}
                />
                {fieldState.error ? (
                  <p className="text-sm text-destructive">{fieldState.error.message}</p>
                ) : null}
              </div>
            )}
          />

          <Controller
            name="title"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <label className="text-sm font-medium">Tiêu đề</label>
                <Input {...field} placeholder="Thiết kế trang đăng nhập" />
                {fieldState.error ? (
                  <p className="text-sm text-destructive">{fieldState.error.message}</p>
                ) : null}
              </div>
            )}
          />

          <Controller
            name="description"
            control={form.control}
            render={({ field }) => (
              <div className="space-y-2">
                <label className="text-sm font-medium">Mô tả</label>
                <Textarea {...field} rows={3} placeholder="Chi tiết công việc (không bắt buộc)" />
              </div>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="assigneeId"
              control={form.control}
              render={({ field }) => (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Người thực hiện</label>
                  <AppSelect
                    className="w-full"
                    value={field.value ? field.value : UNASSIGNED}
                    onValueChange={(value) =>
                      field.onChange(value === UNASSIGNED ? "" : value)
                    }
                    options={[
                      { value: UNASSIGNED, label: "— Chưa giao —" },
                      ...members.map((member) => ({
                        value: String(member.userId),
                        label: member.user.name,
                      })),
                    ]}
                  />
                </div>
              )}
            />

            <Controller
              name="priority"
              control={form.control}
              render={({ field }) => (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Độ ưu tiên</label>
                  <AppSelect
                    className="w-full"
                    value={field.value}
                    onValueChange={(value) => field.onChange(value as ETaskPriority)}
                    options={Object.values(ETaskPriority).map((priority) => ({
                      value: priority,
                      label: TASK_PRIORITY_LABELS[priority],
                    }))}
                  />
                </div>
              )}
            />
          </div>

          <Controller
            name="deadline"
            control={form.control}
            render={({ field }) => (
              <div className="space-y-2">
                <label className="text-sm font-medium">Deadline</label>
                <DatePicker
                  value={field.value ? new Date(field.value) : undefined}
                  onChange={(date) =>
                    field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                  }
                  placeholder="Chọn deadline"
                />
              </div>
            )}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
