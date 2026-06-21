import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  CalendarClock,
  CheckCircle2,
  FolderKanban,
  ListChecks,
  ListTodo,
  Loader2,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ETaskStatus, TASK_STATUS_LABELS } from "@/app/shared/enums/ETaskStatus";
import { ETaskPriority, TASK_PRIORITY_LABELS } from "@/app/shared/enums/ETaskPriority";
import type { ITask } from "@/app/entities/task.entity";
import { fetchProjects } from "@/redux/projectsSlice";
import { fetchTasks } from "@/redux/tasksSlice";

/** Card showing one headline number; optionally links to a section. */
function StatCard({
  label,
  value,
  icon: Icon,
  to,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  to?: string;
}) {
  const card = (
    <Card
      role="group"
      aria-label={label}
      className={`gap-2 py-4 transition ${to ? "hover:border-primary/40 hover:shadow-md" : ""}`}
    >
      <CardHeader className="px-4">
        <CardDescription className="flex items-center gap-2">
          <Icon className="size-4" /> {label}
        </CardDescription>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
  return to ? (
    <Link to={to} className="block">
      {card}
    </Link>
  ) : (
    card
  );
}

export default function HomePage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const tasks = useAppSelector((state) => state.tasks.items);
  const tasksLoading = useAppSelector((state) => state.tasks.loading);
  const taskTotal = useAppSelector((state) => state.tasks.pagination.total);
  const projectTotal = useAppSelector((state) => state.projects.pagination.total);
  // Reference "now" captured once at mount — keeps the upcoming filter pure across re-renders.
  const [now] = useState(() => Date.now());

  // Pull a page of accessible tasks (BE already scopes to the current user) for the
  // status breakdown + upcoming list, plus a 1-row project query just for the total.
  useEffect(() => {
    void dispatch(
      fetchProjects({ page: 1, limit: 1, sortBy: "createdAt", sortOrder: "desc" }),
    );
    void dispatch(
      fetchTasks({ page: 1, limit: 100, sortBy: "deadline", sortOrder: "asc" }),
    );
  }, [dispatch]);

  if (!user) {
    return null;
  }

  const countByStatus = (status: ETaskStatus) =>
    tasks.filter((task) => task.status === status).length;

  const isOpen = (task: ITask) =>
    task.status !== ETaskStatus.Done && task.status !== ETaskStatus.Cancelled;

  const upcoming = tasks
    .filter(
      (task) =>
        task.deadline && isOpen(task) && new Date(task.deadline).getTime() >= now,
    )
    .sort(
      (a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Chào, {user.name} 👋</h1>
        <p className="text-sm text-muted-foreground">
          Đây là tổng quan công việc của bạn. Chọn một thẻ để đi tới mục chi tiết.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Dự án" value={projectTotal} icon={FolderKanban} to="/projects" />
        <StatCard label="Tổng task" value={taskTotal} icon={ListChecks} to="/tasks" />
        <StatCard
          label={TASK_STATUS_LABELS[ETaskStatus.Todo]}
          value={countByStatus(ETaskStatus.Todo)}
          icon={ListTodo}
        />
        <StatCard
          label={TASK_STATUS_LABELS[ETaskStatus.InProgress]}
          value={countByStatus(ETaskStatus.InProgress)}
          icon={Loader2}
        />
        <StatCard
          label={TASK_STATUS_LABELS[ETaskStatus.Done]}
          value={countByStatus(ETaskStatus.Done)}
          icon={CheckCircle2}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="size-5" /> Task sắp tới hạn
          </CardTitle>
          <CardDescription>
            Các task chưa hoàn tất, sắp xếp theo deadline gần nhất.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tasksLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
          ) : upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Không có task nào sắp tới hạn. 🎉
            </p>
          ) : (
            <ul aria-label="Task sắp tới hạn" className="divide-y">
              {upcoming.map((task) => (
                <li
                  key={task.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{task.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {task.project?.name ?? "—"} ·{" "}
                      {TASK_STATUS_LABELS[task.status]} ·{" "}
                      {TASK_PRIORITY_LABELS[task.priority as ETaskPriority]}
                    </div>
                  </div>
                  <div className="text-sm tabular-nums text-muted-foreground">
                    {new Date(task.deadline!).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
