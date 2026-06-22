import { describe, expect, it } from "vitest";
import { ETaskStatus } from "@/app/shared/enums/ETaskStatus";
import { ETaskPriority } from "@/app/shared/enums/ETaskPriority";
import type { ITask } from "@/app/entities/task.entity";
import {
  KANBAN_COLUMNS,
  columnDroppableId,
  groupTasksByStatus,
  isColumnId,
  resolveStatusChange,
  statusFromColumnId,
} from "./kanban";

function makeTask(id: number, status: ETaskStatus): ITask {
  return {
    id,
    title: `Task ${id}`,
    description: null,
    projectId: 1,
    creatorId: 1,
    assigneeId: null,
    status,
    priority: ETaskPriority.Medium,
    deadline: null,
    createdAt: "2026-06-22T00:00:00.000Z",
    updatedAt: "2026-06-22T00:00:00.000Z",
    creator: null,
    assignee: null,
    project: null,
    tags: [],
  };
}

describe("KANBAN_COLUMNS", () => {
  it("lists all five statuses in workflow order", () => {
    expect(KANBAN_COLUMNS).toEqual([
      ETaskStatus.Todo,
      ETaskStatus.InProgress,
      ETaskStatus.Review,
      ETaskStatus.Done,
      ETaskStatus.Cancelled,
    ]);
  });
});

describe("groupTasksByStatus", () => {
  it("buckets each task under its status", () => {
    const columns = groupTasksByStatus([
      makeTask(1, ETaskStatus.Todo),
      makeTask(2, ETaskStatus.Todo),
      makeTask(3, ETaskStatus.Done),
    ]);
    expect(columns[ETaskStatus.Todo].map((t) => t.id)).toEqual([1, 2]);
    expect(columns[ETaskStatus.Done].map((t) => t.id)).toEqual([3]);
  });

  it("returns every column even when empty", () => {
    const columns = groupTasksByStatus([]);
    for (const status of KANBAN_COLUMNS) {
      expect(columns[status]).toEqual([]);
    }
  });

  it("ignores tasks with an unknown status", () => {
    const stray = { ...makeTask(9, ETaskStatus.Todo), status: "LEGACY" as ETaskStatus };
    const columns = groupTasksByStatus([stray]);
    expect(columns[ETaskStatus.Todo]).toEqual([]);
  });

  it("preserves input order within a column", () => {
    const columns = groupTasksByStatus([
      makeTask(3, ETaskStatus.Review),
      makeTask(1, ETaskStatus.Review),
      makeTask(2, ETaskStatus.Review),
    ]);
    expect(columns[ETaskStatus.Review].map((t) => t.id)).toEqual([3, 1, 2]);
  });
});

describe("column id helpers", () => {
  it("round-trips a status through the droppable id", () => {
    const id = columnDroppableId(ETaskStatus.InProgress);
    expect(isColumnId(id)).toBe(true);
    expect(statusFromColumnId(id)).toBe(ETaskStatus.InProgress);
  });

  it("does not treat a bare card id as a column id", () => {
    expect(isColumnId("42")).toBe(false);
  });
});

describe("resolveStatusChange", () => {
  const tasks = [
    makeTask(1, ETaskStatus.Todo),
    makeTask(2, ETaskStatus.Done),
  ];

  it("moves a card dropped on a different column", () => {
    const result = resolveStatusChange(1, columnDroppableId(ETaskStatus.InProgress), tasks);
    expect(result).toEqual({ task: tasks[0], status: ETaskStatus.InProgress });
  });

  it("returns null when dropped on its own column", () => {
    expect(resolveStatusChange(1, columnDroppableId(ETaskStatus.Todo), tasks)).toBeNull();
  });

  it("uses the target card's status when dropped over another card", () => {
    const result = resolveStatusChange(1, 2, tasks);
    expect(result).toEqual({ task: tasks[0], status: ETaskStatus.Done });
  });

  it("returns null when there is no drop target", () => {
    expect(resolveStatusChange(1, null, tasks)).toBeNull();
  });

  it("returns null when the dragged task is unknown", () => {
    expect(resolveStatusChange(999, columnDroppableId(ETaskStatus.Done), tasks)).toBeNull();
  });

  it("returns null for an invalid target status", () => {
    expect(resolveStatusChange(1, "col:LEGACY", tasks)).toBeNull();
  });

  it("coerces numeric and string ids consistently", () => {
    const result = resolveStatusChange("1", columnDroppableId(ETaskStatus.Review), tasks);
    expect(result).toEqual({ task: tasks[0], status: ETaskStatus.Review });
  });
});
