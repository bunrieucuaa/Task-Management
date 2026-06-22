import { ETaskStatus } from "@/app/shared/enums/ETaskStatus";
import type { ITask } from "@/app/entities/task.entity";

/** Ordered Kanban columns — one per task status, left-to-right workflow order. */
export const KANBAN_COLUMNS: ETaskStatus[] = [
  ETaskStatus.Todo,
  ETaskStatus.InProgress,
  ETaskStatus.Review,
  ETaskStatus.Done,
  ETaskStatus.Cancelled,
];

export type KanbanColumns = Record<ETaskStatus, ITask[]>;

/**
 * Group tasks into one bucket per status. Every column is present (even if empty)
 * so the board can render a stable set of columns. Tasks whose status is not a
 * known column (legacy/unknown values) are dropped rather than crashing the board.
 * Input order is preserved within each column.
 */
export function groupTasksByStatus(tasks: ITask[]): KanbanColumns {
  const columns = Object.fromEntries(
    KANBAN_COLUMNS.map((status) => [status, [] as ITask[]]),
  ) as KanbanColumns;
  for (const task of tasks) {
    const bucket = columns[task.status];
    if (bucket) {
      bucket.push(task);
    }
  }
  return columns;
}

/**
 * dnd-kit ids are strings. A column's droppable id is prefixed so it can never
 * collide with a card id (a task id stringified).
 */
const COLUMN_ID_PREFIX = "col:";

export const columnDroppableId = (status: ETaskStatus): string =>
  `${COLUMN_ID_PREFIX}${status}`;

export const isColumnId = (id: string): boolean => id.startsWith(COLUMN_ID_PREFIX);

export const statusFromColumnId = (id: string): ETaskStatus =>
  id.slice(COLUMN_ID_PREFIX.length) as ETaskStatus;

/**
 * Resolve a drag-end into the status change to apply, or `null` when nothing
 * should change. `overId` may be a column droppable id (`col:STATUS`) or another
 * card's id — in the latter case the target status is that card's column.
 */
export function resolveStatusChange(
  activeId: string | number,
  overId: string | number | null,
  tasks: ITask[],
): { task: ITask; status: ETaskStatus } | null {
  if (overId == null) {
    return null;
  }
  const task = tasks.find((candidate) => String(candidate.id) === String(activeId));
  if (!task) {
    return null;
  }

  const over = String(overId);
  const targetStatus = isColumnId(over)
    ? statusFromColumnId(over)
    : tasks.find((candidate) => String(candidate.id) === over)?.status;

  if (!targetStatus || !KANBAN_COLUMNS.includes(targetStatus)) {
    return null;
  }
  if (targetStatus === task.status) {
    return null;
  }
  return { task, status: targetStatus };
}
