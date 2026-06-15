import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { MoreHorizontal, Plus, RefreshCcw } from "lucide-react";
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
import { ERole } from "@/app/shared/enums/ERole";
import { EUserStatus } from "@/app/shared/enums/EUserStatus";
import type { ICreateUserPayload, IUserListQuery } from "@/app/entities/user.entity";
import UserCreateDialog from "@/components/pages/users/UserCreateDialog";
import TemporaryPasswordDialog from "@/components/pages/users/TemporaryPasswordDialog";
import {
  clearTemporaryPasswordResult,
  createUser,
  deleteUser,
  fetchUsers,
  initialFilters,
  resetUserPassword,
  updateUserStatus,
} from "@/redux/usersSlice";

export default function UsersPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const {
    items,
    loading,
    submitting,
    pagination,
    temporaryPasswordResult,
  } = useAppSelector((state) => state.users);
  const [query, setQuery] = useState<IUserListQuery>(initialFilters);
  const [draft, setDraft] = useState<IUserListQuery>(initialFilters);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (user?.role === ERole.Admin) {
      void dispatch(fetchUsers(query));
    }
  }, [dispatch, query, user?.role]);

  if (!user) {
    return null;
  }

  if (user.role !== ERole.Admin) {
    return <Navigate to="/" replace />;
  }

  function handleDraftChange<Key extends keyof IUserListQuery>(
    key: Key,
    value: IUserListQuery[Key],
  ) {
    setDraft((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function handleSearch() {
    setQuery({ ...draft, page: 1 });
  }

  function handleResetFilters() {
    setDraft(initialFilters);
    setQuery(initialFilters);
  }

  async function handleCreateUser(payload: ICreateUserPayload) {
    const result = await dispatch(createUser(payload)).unwrap();
    if (result) {
      toast.success("Tạo user thành công!", { position: "bottom-right" });
      setIsCreateDialogOpen(false);
      setQuery((previous) => ({ ...previous, page: 1 }));
    }
  }

  function reloadCurrentPage() {
    setQuery((previous) => ({ ...previous }));
  }

  function handleUpdateStatus(id: number, status: EUserStatus) {
    dispatch(updateUserStatus({ id: String(id), data: { status } }))
      .unwrap()
      .then((updatedUser) => {
        if (updatedUser) {
          toast.success("Cập nhật trạng thái thành công!", {
            position: "bottom-right",
          });
          reloadCurrentPage();
        }
      })
      .catch((error) => {
        console.error("Update status error:", error);
      });
  }

  function handleResetPassword(id: number) {
    dispatch(resetUserPassword(String(id)))
      .unwrap()
      .then((result) => {
        if (result) {
          toast.success("Reset mật khẩu thành công!", {
            position: "bottom-right",
          });
          reloadCurrentPage();
        }
      })
      .catch((error) => {
        console.error("Reset password error:", error);
      });
  }

  function handleDeleteUser(id: number) {
    if (!window.confirm("Xóa mềm user này? User sẽ bị BLOCKED và revoke token.")) {
      return;
    }

    dispatch(deleteUser(String(id)))
      .unwrap()
      .then((deletedId) => {
        if (deletedId) {
          toast.success("Xóa user thành công!", { position: "bottom-right" });
          reloadCurrentPage();
        }
      })
      .catch((error) => {
        console.error("Delete user error:", error);
      });
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Users Management</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý user theo đúng flow create, block, reset password và soft delete.
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="size-4" /> Tạo user
        </Button>
      </div>

      <div className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-6">
        <Input
          value={draft.search ?? ""}
          onChange={(event) => handleDraftChange("search", event.target.value)}
          placeholder="Tìm theo tên hoặc email"
          className="md:col-span-2"
        />

        <AppSelect
          className="w-full"
          value={draft.role ? draft.role : ALL}
          onValueChange={(value) =>
            handleDraftChange("role", value === ALL ? "" : (value as ERole))
          }
          options={[
            { value: ALL, label: "Tất cả role" },
            { value: ERole.Admin, label: "ADMIN" },
            { value: ERole.PM, label: "PM" },
            { value: ERole.Member, label: "MEMBER" },
          ]}
        />

        <AppSelect
          className="w-full"
          value={draft.status ? draft.status : ALL}
          onValueChange={(value) =>
            handleDraftChange("status", value === ALL ? "" : (value as EUserStatus))
          }
          options={[
            { value: ALL, label: "Tất cả status" },
            { value: EUserStatus.Active, label: "ACTIVE" },
            { value: EUserStatus.Inactive, label: "INACTIVE" },
            { value: EUserStatus.Blocked, label: "BLOCKED" },
          ]}
        />

        <AppSelect
          className="w-full"
          value={draft.sortBy ?? "createdAt"}
          onValueChange={(value) =>
            handleDraftChange("sortBy", value as IUserListQuery["sortBy"])
          }
          options={[
            { value: "createdAt", label: "Created At" },
            { value: "name", label: "Name" },
            { value: "email", label: "Email" },
            { value: "role", label: "Role" },
            { value: "status", label: "Status" },
          ]}
        />

        <AppSelect
          className="w-full"
          value={draft.sortOrder ?? "desc"}
          onValueChange={(value) =>
            handleDraftChange("sortOrder", value as IUserListQuery["sortOrder"])
          }
          options={[
            { value: "desc", label: "DESC" },
            { value: "asc", label: "ASC" },
          ]}
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
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Must change</TableHead>
              <TableHead>Updated</TableHead>
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
                <TableCell colSpan={7}>Chưa có user nào.</TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const isSelf = item.id === user.id;
                return (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.email}</TableCell>
                    <TableCell>{item.role}</TableCell>
                    <TableCell>{item.status}</TableCell>
                    <TableCell>{item.mustChangePassword ? "Yes" : "No"}</TableCell>
                    <TableCell>{new Date(item.updatedAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon-sm" aria-label="User actions">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {isSelf ? (
                            <>
                              <DropdownMenuItem onClick={() => navigate({ to: "/account" })}>
                                Edit profile
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          ) : null}
                          <DropdownMenuItem
                            disabled={submitting || isSelf || item.status === EUserStatus.Active}
                            onClick={() => handleUpdateStatus(item.id, EUserStatus.Active)}
                          >
                            Set ACTIVE
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={submitting || isSelf || item.status === EUserStatus.Inactive}
                            onClick={() => handleUpdateStatus(item.id, EUserStatus.Inactive)}
                          >
                            Set INACTIVE
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={submitting || isSelf || item.status === EUserStatus.Blocked}
                            onClick={() => handleUpdateStatus(item.id, EUserStatus.Blocked)}
                          >
                            Set BLOCKED
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={submitting || isSelf}
                            onClick={() => handleResetPassword(item.id)}
                          >
                            Reset password
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            disabled={submitting || isSelf}
                            onClick={() => handleDeleteUser(item.id)}
                          >
                            Delete user
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
            Trang {pagination.page} / {Math.max(pagination.totalPages, 1)} · Tổng {pagination.total} user
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
              disabled={query.page >= pagination.totalPages || loading || pagination.totalPages === 0}
              onClick={() => setQuery((previous) => ({ ...previous, page: previous.page + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <UserCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        submitting={submitting}
        onSubmit={handleCreateUser}
      />

      <TemporaryPasswordDialog
        open={!!temporaryPasswordResult}
        data={temporaryPasswordResult}
        onClose={() => dispatch(clearTemporaryPasswordResult())}
      />
    </div>
  );
}
