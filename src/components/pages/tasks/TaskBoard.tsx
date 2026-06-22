import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ETaskStatus, TASK_STATUS_LABELS } from "@/app/shared/enums/ETaskStatus";
import { ETaskPriority, TASK_PRIORITY_LABELS } from "@/app/shared/enums/ETaskPriority";
import type { ITask } from "@/app/entities/task.entity";
import { cn } from "@/lib/utils";
import { tagColor } from "@/lib/tagColor";
import {
  KANBAN_COLUMNS,
  columnDroppableId,
  groupTasksByStatus,
  resolveStatusChange,
} from "@/lib/kanban";

const PRIORITY_BADGE: Record<ETaskPriority, string> = {
  [ETaskPriority.Low]: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  [ETaskPriority.Medium]: "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300",
  [ETaskPriority.High]: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  [ETaskPriority.Urgent]: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

interface TaskBoardProps {
  tasks: ITask[];
  /** Whether the current user may move (change status of) this task. */
  canEdit: (task: ITask) => boolean;
  /** Called when a card is dropped on a different column. */
  onStatusChange: (task: ITask, status: ETaskStatus) => void;
  submitting?: boolean;
}

/** The visual card body, shared by the column cards and the drag overlay. */
function TaskCardBody({ task }: { task: ITask }) {
  return (
    <div className="space-y-2">
      <div className="font-medium leading-snug">{task.title}</div>
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <span>{task.project?.name ?? "—"}</span>
        <span aria-hidden>·</span>
        <span>{task.assignee?.name ?? "Chưa giao"}</span>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-xs font-medium",
            PRIORITY_BADGE[task.priority],
          )}
        >
          {TASK_PRIORITY_LABELS[task.priority]}
        </span>
        {task.tags?.map((tag) => (
          <span
            key={tag.id}
            className={cn("rounded px-1.5 py-0.5 text-xs font-medium", tagColor(tag.name))}
          >
            {tag.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function TaskCard({ task, draggable }: { task: ITask; draggable: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(task.id),
    disabled: !draggable,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "rounded-lg border bg-card p-3 shadow-sm",
        draggable ? "cursor-grab active:cursor-grabbing" : "opacity-80",
        isDragging && "opacity-40",
      )}
      data-testid={`task-card-${task.id}`}
      data-draggable={draggable}
      {...(draggable ? attributes : {})}
      {...(draggable ? listeners : {})}
    >
      <TaskCardBody task={task} />
    </div>
  );
}

function BoardColumn({
  status,
  tasks,
  canEdit,
}: {
  status: ETaskStatus;
  tasks: ITask[];
  canEdit: (task: ITask) => boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnDroppableId(status) });

  return (
    <div
      ref={setNodeRef}
      data-testid={`column-${status}`}
      className={cn(
        "flex min-h-40 w-72 shrink-0 flex-col gap-3 rounded-xl border bg-muted/30 p-3 transition-colors",
        isOver && "border-primary bg-primary/5",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{TASK_STATUS_LABELS[status]}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {tasks.length}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {tasks.length === 0 ? (
          <p className="px-1 py-6 text-center text-xs text-muted-foreground">Trống</p>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} draggable={canEdit(task)} />
          ))
        )}
      </div>
    </div>
  );
}

export default function TaskBoard({
  tasks,
  canEdit,
  onStatusChange,
}: TaskBoardProps) {
  const [activeTask, setActiveTask] = useState<ITask | null>(null);
  const sensors = useSensors(
    // A small activation distance keeps clicks/taps from being read as drags.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const columns = groupTasksByStatus(tasks);

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((candidate) => String(candidate.id) === String(event.active.id));
    setActiveTask(task ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const change = resolveStatusChange(event.active.id, event.over?.id ?? null, tasks);
    if (change) {
      onStatusChange(change.task, change.status);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-2">
        {KANBAN_COLUMNS.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            tasks={columns[status]}
            canEdit={canEdit}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="w-72 rotate-2 rounded-lg border bg-card p-3 shadow-lg">
            <TaskCardBody task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
