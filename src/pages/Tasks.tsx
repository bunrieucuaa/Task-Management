import { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { History, MessageSquare, MoreHorizontal, Plus, RefreshCcw } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { AppSelect } from "@/components/ui/app-select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** Sentinel for the "all" filter option (Radix Select forbids value=""). */
const ALL = "ALL";
import { ERole, isPrivilegedRole } from "@/app/shared/enums/ERole";
import { ETaskStatus, TASK_STATUS_LABELS } from "@/app/shared/enums/ETaskStatus";
import { ETaskPriority, TASK_PRIORITY_LABELS } from "@/app/shared/enums/ETaskPriority";
import type { ITask, ITaskListQuery, IUpdateTaskPayload } from "@/app/entities/task.entity";
import type { ITag } from "@/app/entities/tag.entity";
import { cn } from "@/lib/utils";
import { tagColor } from "@/lib/tagColor";
import { TagRepository } from "@/app/repositories/TagRepository";
import TaskFormDialog, {
  type TaskFormSubmit,
} from "@/components/pages/tasks/TaskFormDialog";
import TaskCommentsDialog from "@/components/pages/tasks/TaskCommentsDialog";
import TaskActivityDialog from "@/components/pages/tasks/TaskActivityDialog";
import { fetchMembers, fetchProjects } from "@/redux/projectsSlice";
import {
  createTask,
  deleteTask,
  fetchTasks,
  initialFilters,
  updateTask,
} from "@/redux/tasksSlice";
import { createTag, fetchTags } from "@/redux/tagsSlice";

export default function Tasks() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { items, loading, submitting, pagination } = useAppSelector((state) => state.tasks);
  const projects = useAppSelector((state) => state.projects.items);
  const members = useAppSelector((state) => state.projects.members);
  const tags = useAppSelector((state) => state.tags.items);

  const [query, setQuery] = useState<ITaskListQuery>(initialFilters);
  const [draft, setDraft] = useState<ITaskListQuery>(initialFilters);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ITask | null>(null);
  const [editingTags, setEditingTags] = useState<ITag[]>([]);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsTask, setCommentsTask] = useState<ITask | null>(null);
  const [activityOpen, setActivityOpen] = useState(false);
  const [activityTask, setActivityTask] = useState<ITask | null>(null);

  // Load project options + the tag catalog once for the pickers / filters.
  useEffect(() => {
    void dispatch(fetchProjects({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" }));
    void dispatch(fetchTags());
  }, [dispatch]);

  useEffect(() => {
    void dispatch(fetchTasks(query));
  }, [dispatch, query]);

  if (!user) {
    return null;
  }

  const canEdit = (task: ITask) =>
    user.role === ERole.Admin ||
    task.creatorId === user.id ||
    task.assigneeId === user.id;

  const canDelete = (task: ITask) =>
    user.role === ERole.Admin || task.creatorId === user.id;

  const canCreateTag = isPrivilegedRole(user.role as ERole);

  function handleDraftChange<Key extends keyof ITaskListQuery>(
    key: Key,
    value: ITaskListQuery[Key],
  ) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  function handleProjectFilterChange(value: string) {
    const projectId = value ? Number(value) : "";
    handleDraftChange("projectId", projectId);
    handleDraftChange("assigneeId", "");
    if (projectId) {
      void dispatch(fetchMembers(String(projectId)));
    }
  }

  function handleSearch() {
    setQuery({ ...draft, page: 1 });
  }

  function handleResetFilters() {
    setDraft(initialFilters);
    setQuery(initialFilters);
  }

  function openCreate() {
    setEditingTask(null);
    setFormOpen(true);
  }

  function openEdit(task: ITask) {
    setEditingTask(task);
    setEditingTags(task.tags ?? []);
    setFormOpen(true);
  }

  function openComments(task: ITask) {
    setCommentsTask(task);
    setCommentsOpen(true);
  }

  function openActivity(task: ITask) {
    setActivityTask(task);
    setActivityOpen(true);
  }

  // Attach/detach a tag on the task being edited. Optimistic: update the local
  // selection immediately, revert if the request fails (BaseApiDataSource toasts).
  async function handleToggleTag(tag: ITag) {
    if (!editingTask) {
      return;
    }
    const attached = editingTags.some((item) => item.id === tag.id);
    const repo = new TagRepository();
    setEditingTags((previous) =>
      attached ? previous.filter((item) => item.id !== tag.id) : [...previous, tag],
    );
    const response = attached
      ? await repo.detachFromTaskAsync(editingTask.id, tag.id)
      : await repo.attachToTaskAsync(editingTask.id, tag.id);
    if (!response.success) {
      // Revert on failure.
      setEditingTags((previous) =>
        attached ? [...previous, tag] : previous.filter((item) => item.id !== tag.id),
      );
    }
  }

  async function handleCreateTag(name: string) {
    const created = await dispatch(createTag(name)).unwrap();
    if (created) {
      await handleToggleTag(created);
    }
  }

  // Refresh the list when the edit dialog closes so tag changes show on the rows.
  function handleFormOpenChange(open: boolean) {
    setFormOpen(open);
    if (!open && editingTask) {
      void dispatch(fetchTasks(query));
    }
  }

  async function handleSubmitForm(payload: TaskFormSubmit) {
    if (editingTask) {
      const data: IUpdateTaskPayload = {
        title: payload.title,
        description: payload.description || null,
        assigneeId: payload.assigneeId,
        priority: payload.priority,
        deadline: payload.deadline,
      };
      const result = await dispatch(
        updateTask({ id: String(editingTask.id), data }),
      ).unwrap();
      if (result) {
        toast.success("Cập nhật task thành công!", { position: "bottom-right" });
        setFormOpen(false);
      }
      return;
    }

    const result = await dispatch(
      createTask({
        title: payload.title,
        description: payload.description || undefined,
        projectId: payload.projectId,
        assigneeId: payload.assigneeId,
        priority: payload.priority,
        deadline: payload.deadline,
      }),
    ).unwrap();
    if (result) {
      toast.success("Tạo task thành công!", { position: "bottom-right" });
      setFormOpen(false);
      setQuery((previous) => ({ ...previous, page: 1 }));
    }
  }

  function handleQuickUpdate(task: ITask, data: IUpdateTaskPayload) {
    dispatch(updateTask({ id: String(task.id), data }))
      .unwrap()
      .then((result) => {
        if (result) {
          toast.success("Đã cập nhật!", { position: "bottom-right" });
        }
      })
      .catch((error) => console.error("Quick update error:", error));
  }

  function handleDelete(task: ITask) {
    if (!window.confirm(`Xoá task "${task.title}"?`)) {
      return;
    }
    dispatch(deleteTask(String(task.id)))
      .unwrap()
      .then((deletedId) => {
        if (deletedId) {
          toast.success("Đã xoá task!", { position: "bottom-right" });
        }
      })
      .catch((error) => console.error("Delete task error:", error));
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý công việc theo project. Chọn project để lọc và giao việc cho thành viên.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" /> Tạo task
        </Button>
      </div>

      <div className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-6">
        <AppSelect
          className="w-full md:col-span-2"
          value={draft.projectId === "" ? ALL : String(draft.projectId)}
          onValueChange={(value) => handleProjectFilterChange(value === ALL ? "" : value)}
          options={[
            { value: ALL, label: "Tất cả project (của tôi)" },
            ...projects.map((project) => ({
              value: String(project.id),
              label: project.name,
            })),
          ]}
        />

        <AppSelect
          className="w-full"
          value={draft.status ? draft.status : ALL}
          onValueChange={(value) =>
            handleDraftChange("status", value === ALL ? "" : (value as ETaskStatus))
          }
          options={[
            { value: ALL, label: "Tất cả status" },
            ...Object.values(ETaskStatus).map((status) => ({
              value: status,
              label: TASK_STATUS_LABELS[status],
            })),
          ]}
        />

        <AppSelect
          className="w-full"
          value={draft.priority ? draft.priority : ALL}
          onValueChange={(value) =>
            handleDraftChange("priority", value === ALL ? "" : (value as ETaskPriority))
          }
          options={[
            { value: ALL, label: "Tất cả ưu tiên" },
            ...Object.values(ETaskPriority).map((priority) => ({
              value: priority,
              label: TASK_PRIORITY_LABELS[priority],
            })),
          ]}
        />

        <AppSelect
          className="w-full"
          value={draft.tagId ? String(draft.tagId) : ALL}
          onValueChange={(value) =>
            handleDraftChange("tagId", value === ALL ? "" : Number(value))
          }
          options={[
            { value: ALL, label: "Tất cả nhãn" },
            ...tags.map((tag) => ({ value: String(tag.id), label: tag.name })),
          ]}
        />

        <Input
          value={draft.search ?? ""}
          onChange={(event) => handleDraftChange("search", event.target.value)}
          placeholder="Tìm theo tiêu đề / mô tả"
        />

        <DatePicker
          value={draft.deadlineFrom ? new Date(draft.deadlineFrom) : undefined}
          onChange={(date) =>
            handleDraftChange(
              "deadlineFrom",
              date ? `${format(date, "yyyy-MM-dd")}T00:00:00.000Z` : "",
            )
          }
          placeholder="Deadline từ"
        />
        <DatePicker
          value={draft.deadlineTo ? new Date(draft.deadlineTo) : undefined}
          onChange={(date) =>
            handleDraftChange(
              "deadlineTo",
              date ? `${format(date, "yyyy-MM-dd")}T23:59:59.999Z` : "",
            )
          }
          placeholder="Deadline đến"
        />

        <div className="flex gap-2 md:col-span-6 md:justify-end">
          <Button variant="outline" onClick={handleResetFilters}>
            Reset
          </Button>
          <Button onClick={handleSearch}>
            <RefreshCcw className="size-4" /> Tìm kiếm
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Người thực hiện</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ưu tiên</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7}>Đang tải dữ liệu...</TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>Chưa có task nào.</TableCell>
              </TableRow>
            ) : (
              items.map((task) => {
                const editable = canEdit(task);
                return (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div className="font-medium">{task.title}</div>
                      {task.description ? (
                        <div className="max-w-xs truncate text-xs text-muted-foreground">
                          {task.description}
                        </div>
                      ) : null}
                      {task.tags && task.tags.length > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {task.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className={cn(
                                "rounded px-1.5 py-0.5 text-xs font-medium",
                                tagColor(tag.name),
                              )}
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>{task.project?.name ?? "—"}</TableCell>
                    <TableCell>{task.assignee?.name ?? "Chưa giao"}</TableCell>
                    <TableCell>
                      <AppSelect
                        size="sm"
                        className="w-full"
                        value={task.status}
                        disabled={!editable || submitting}
                        onValueChange={(value) =>
                          handleQuickUpdate(task, { status: value as ETaskStatus })
                        }
                        options={Object.values(ETaskStatus).map((status) => ({
                          value: status,
                          label: TASK_STATUS_LABELS[status],
                        }))}
                      />
                    </TableCell>
                    <TableCell>
                      <AppSelect
                        size="sm"
                        className="w-full"
                        value={task.priority}
                        disabled={!editable || submitting}
                        onValueChange={(value) =>
                          handleQuickUpdate(task, { priority: value as ETaskPriority })
                        }
                        options={Object.values(ETaskPriority).map((priority) => ({
                          value: priority,
                          label: TASK_PRIORITY_LABELS[priority],
                        }))}
                      />
                    </TableCell>
                    <TableCell>
                      {task.deadline ? new Date(task.deadline).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon-sm" aria-label="Task actions">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem disabled={!editable} onClick={() => openEdit(task)}>
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openComments(task)}>
                            <MessageSquare className="size-4" /> Bình luận
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openActivity(task)}>
                            <History className="size-4" /> Lịch sử
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            disabled={!canDelete(task) || submitting}
                            onClick={() => handleDelete(task)}
                          >
                            Xoá
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Trang {pagination.page} / {Math.max(pagination.totalPages, 1)} · Tổng{" "}
            {pagination.total} task
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={query.page <= 1 || loading}
              onClick={() => setQuery((previous) => ({ ...previous, page: previous.page - 1 }))}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              disabled={
                query.page >= pagination.totalPages || loading || pagination.totalPages === 0
              }
              onClick={() => setQuery((previous) => ({ ...previous, page: previous.page + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <TaskFormDialog
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        submitting={submitting}
        task={editingTask}
        defaultProjectId={draft.projectId === "" ? null : Number(draft.projectId)}
        projects={projects}
        members={members}
        onProjectChange={(projectId) => {
          if (projectId) {
            void dispatch(fetchMembers(String(projectId)));
          }
        }}
        onSubmit={handleSubmitForm}
        tags={tags}
        selectedTagIds={editingTags.map((tag) => tag.id)}
        canCreateTag={canCreateTag}
        onToggleTag={handleToggleTag}
        onCreateTag={handleCreateTag}
      />

      <TaskCommentsDialog
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        task={commentsTask}
      />

      <TaskActivityDialog
        open={activityOpen}
        onOpenChange={setActivityOpen}
        task={activityTask}
      />
    </div>
  );
}
