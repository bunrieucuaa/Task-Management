import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Plus, RefreshCcw, Users } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { AppSelect } from "@/components/ui/app-select";
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
import { isPrivilegedRole } from "@/app/shared/enums/ERole";
import { EProjectStatus } from "@/app/shared/enums/EProjectStatus";
import type {
  IProject,
  IProjectListQuery,
} from "@/app/entities/project.entity";
import type { IUserDirectoryItem } from "@/app/entities/user.entity";
import ProjectFormDialog, {
  type ProjectFormSubmit,
} from "@/components/pages/projects/ProjectFormDialog";
import ProjectMembersDialog from "@/components/pages/projects/ProjectMembersDialog";
import {
  addMember,
  createProject,
  deleteProject,
  fetchDirectory,
  fetchMembers,
  fetchProjects,
  initialFilters,
  removeMember,
  updateProject,
} from "@/redux/projectsSlice";

export default function ProjectsPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const {
    items,
    loading,
    submitting,
    pagination,
    members,
    membersLoading,
    directory,
  } = useAppSelector((state) => state.projects);

  const isManager = isPrivilegedRole(user?.role);

  const [query, setQuery] = useState<IProjectListQuery>(initialFilters);
  const [draft, setDraft] = useState<IProjectListQuery>(initialFilters);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<IProject | null>(null);
  const [membersProject, setMembersProject] = useState<IProject | null>(null);

  useEffect(() => {
    void dispatch(fetchProjects(query));
  }, [dispatch, query]);

  // Managers (ADMIN/PM) can browse the directory to add members.
  useEffect(() => {
    if (isManager) {
      void dispatch(fetchDirectory());
    }
  }, [dispatch, isManager]);

  if (!user) {
    return null;
  }

  // PM is admin-equal on every project; only ADMIN/PM can manage.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const canManage = (_project: IProject) => isManager;

  function handleDraftChange<Key extends keyof IProjectListQuery>(
    key: Key,
    value: IProjectListQuery[Key],
  ) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  function handleSearch() {
    setQuery({ ...draft, page: 1 });
  }

  function handleResetFilters() {
    setDraft(initialFilters);
    setQuery(initialFilters);
  }

  function openCreate() {
    setEditingProject(null);
    setFormOpen(true);
  }

  function openEdit(project: IProject) {
    setEditingProject(project);
    setFormOpen(true);
  }

  function openMembers(project: IProject) {
    setMembersProject(project);
    void dispatch(fetchMembers(String(project.id)));
  }

  async function handleSubmitForm(payload: ProjectFormSubmit) {
    if (editingProject) {
      const result = await dispatch(
        updateProject({
          id: String(editingProject.id),
          data: {
            name: payload.name,
            description: payload.description || undefined,
          },
        }),
      ).unwrap();
      if (result) {
        toast.success("Cập nhật project thành công!", {
          position: "bottom-right",
        });
        setFormOpen(false);
      }
      return;
    }

    const result = await dispatch(
      createProject({
        name: payload.name,
        description: payload.description || undefined,
        memberIds: payload.memberIds.length ? payload.memberIds : undefined,
      }),
    ).unwrap();
    if (result) {
      toast.success("Tạo project thành công!", { position: "bottom-right" });
      setFormOpen(false);
      setQuery((previous) => ({ ...previous, page: 1 }));
    }
  }

  function handleArchive(project: IProject) {
    if (!window.confirm(`Lưu trữ (archive) project "${project.name}"?`)) {
      return;
    }
    dispatch(deleteProject(String(project.id)))
      .unwrap()
      .then((archivedId) => {
        if (archivedId) {
          toast.success("Đã lưu trữ project!", { position: "bottom-right" });
          setQuery((previous) => ({ ...previous }));
        }
      })
      .catch((error) => console.error("Archive project error:", error));
  }

  async function handleAddMember(member: IUserDirectoryItem) {
    if (!membersProject) {
      return;
    }
    const result = await dispatch(
      addMember({
        id: String(membersProject.id),
        data: { email: member.email },
      }),
    ).unwrap();
    if (result) {
      toast.success("Đã thêm thành viên!", { position: "bottom-right" });
    }
  }

  async function handleRemoveMember(userId: number) {
    if (!membersProject) {
      return;
    }
    const result = await dispatch(
      removeMember({ id: String(membersProject.id), userId: String(userId) }),
    ).unwrap();
    if (result) {
      toast.success("Đã xoá thành viên!", { position: "bottom-right" });
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý project và thành viên. Bạn chỉ thấy project mình sở hữu hoặc
            tham gia.
          </p>
        </div>
        {isManager ? (
          <Button onClick={openCreate}>
            <Plus className="size-4" /> Tạo project
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-5">
        <Input
          value={draft.search ?? ""}
          onChange={(event) => handleDraftChange("search", event.target.value)}
          placeholder="Tìm theo tên hoặc mô tả"
          className="md:col-span-2"
        />
        <AppSelect
          className="w-full"
          value={draft.status ? draft.status : ALL}
          onValueChange={(value) =>
            handleDraftChange(
              "status",
              value === ALL ? "" : (value as EProjectStatus),
            )
          }
          options={[
            { value: ALL, label: "Tất cả status" },
            { value: EProjectStatus.Active, label: "ACTIVE" },
            { value: EProjectStatus.Archived, label: "ARCHIVED" },
          ]}
        />
        <AppSelect
          className="w-full"
          value={draft.sortBy ?? "createdAt"}
          onValueChange={(value) =>
            handleDraftChange("sortBy", value as IProjectListQuery["sortBy"])
          }
          options={[
            { value: "createdAt", label: "Created At" },
            { value: "updatedAt", label: "Updated At" },
            { value: "name", label: "Name" },
            { value: "status", label: "Status" },
          ]}
        />
        <AppSelect
          className="w-full"
          value={draft.sortOrder ?? "desc"}
          onValueChange={(value) =>
            handleDraftChange(
              "sortOrder",
              value as IProjectListQuery["sortOrder"],
            )
          }
          options={[
            { value: "desc", label: "DESC" },
            { value: "asc", label: "ASC" },
          ]}
        />
        <div className="flex gap-2 md:col-span-5 md:justify-end">
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
              <TableHead>Tên</TableHead>
              <TableHead>Người tạo</TableHead>
              <TableHead>Số Thành viên</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày Cập nhật</TableHead>
              <TableHead>Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7}>Đang tải dữ liệu...</TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>Chưa có project nào.</TableCell>
              </TableRow>
            ) : (
              items.map((project) => {
                const manage = canManage(project);
                return (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div className="font-medium">{project.name}</div>
                    </TableCell>
                    <TableCell className="flex items-center justify-center">
                      {project.owner?.name ?? "—"}
                    </TableCell>
                    <TableCell>{project._count?.members ?? 0}</TableCell>
                    <TableCell>{project.status}</TableCell>
                    <TableCell>
                      {new Date(project.updatedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            aria-label="Project actions"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onClick={() => openMembers(project)}
                          >
                            <Users className="size-4" /> Thành viên
                          </DropdownMenuItem>
                          {manage ? (
                            <>
                              <DropdownMenuItem
                                onClick={() => openEdit(project)}
                              >
                                Chỉnh sửa
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                disabled={
                                  submitting ||
                                  project.status === EProjectStatus.Archived
                                }
                                onClick={() => handleArchive(project)}
                              >
                                Lưu trữ
                              </DropdownMenuItem>
                            </>
                          ) : null}
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
            Trang {pagination.page} / {Math.max(pagination.totalPages, 1)} ·
            Tổng {pagination.total} project
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={query.page <= 1 || loading}
              onClick={() =>
                setQuery((previous) => ({
                  ...previous,
                  page: previous.page - 1,
                }))
              }
            >
              Prev
            </Button>
            <Button
              variant="outline"
              disabled={
                query.page >= pagination.totalPages ||
                loading ||
                pagination.totalPages === 0
              }
              onClick={() =>
                setQuery((previous) => ({
                  ...previous,
                  page: previous.page + 1,
                }))
              }
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <ProjectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        submitting={submitting}
        project={editingProject}
        directory={directory}
        currentUserId={user.id}
        onSubmit={handleSubmitForm}
      />

      <ProjectMembersDialog
        open={Boolean(membersProject)}
        onOpenChange={(open) => {
          if (!open) {
            setMembersProject(null);
          }
        }}
        project={membersProject}
        members={members}
        membersLoading={membersLoading}
        submitting={submitting}
        manageable={isManager}
        directory={directory}
        onAddMember={handleAddMember}
        onRemoveMember={handleRemoveMember}
      />
    </div>
  );
}
