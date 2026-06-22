import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DragEndEvent } from "@dnd-kit/core";
import { ETaskStatus, TASK_STATUS_LABELS } from "@/app/shared/enums/ETaskStatus";
import { ETaskPriority } from "@/app/shared/enums/ETaskPriority";
import type { ITask } from "@/app/entities/task.entity";
import { columnDroppableId } from "@/lib/kanban";
import TaskBoard from "./TaskBoard";

// Capture the DndContext's onDragEnd so tests can simulate a drop without
// driving real pointer events (unreliable in jsdom). The other dnd-kit hooks
// are stubbed to inert no-ops.
let capturedOnDragEnd: ((event: DragEndEvent) => void) | undefined;

vi.mock("@dnd-kit/core", () => ({
  DndContext: ({
    children,
    onDragEnd,
  }: {
    children: React.ReactNode;
    onDragEnd: (event: DragEndEvent) => void;
  }) => {
    capturedOnDragEnd = onDragEnd;
    return <div>{children}</div>;
  },
  DragOverlay: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useDraggable: ({ disabled }: { disabled?: boolean }) => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    isDragging: false,
    disabled,
  }),
  useDroppable: () => ({ setNodeRef: () => {}, isOver: false }),
  useSensor: () => ({}),
  useSensors: () => [],
  PointerSensor: function PointerSensor() {},
  KeyboardSensor: function KeyboardSensor() {},
  closestCorners: () => [],
}));

function makeTask(id: number, status: ETaskStatus, title = `Task ${id}`): ITask {
  return {
    id,
    title,
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
    project: { id: 1, name: "Demo" },
    tags: [],
  };
}

describe("TaskBoard", () => {
  it("renders one column per status with the right card counts", () => {
    const tasks = [
      makeTask(1, ETaskStatus.Todo),
      makeTask(2, ETaskStatus.Todo),
      makeTask(3, ETaskStatus.Done),
    ];
    render(<TaskBoard tasks={tasks} canEdit={() => true} onStatusChange={vi.fn()} />);

    for (const status of Object.values(ETaskStatus)) {
      expect(screen.getByText(TASK_STATUS_LABELS[status])).toBeInTheDocument();
    }
    const todo = screen.getByTestId(`column-${ETaskStatus.Todo}`);
    expect(within(todo).getByTestId("task-card-1")).toBeInTheDocument();
    expect(within(todo).getByTestId("task-card-2")).toBeInTheDocument();
    const done = screen.getByTestId(`column-${ETaskStatus.Done}`);
    expect(within(done).getByTestId("task-card-3")).toBeInTheDocument();
  });

  it("marks cards the user cannot edit as non-draggable", () => {
    const tasks = [makeTask(1, ETaskStatus.Todo), makeTask(2, ETaskStatus.Todo)];
    const canEdit = (task: ITask) => task.id === 1;
    render(<TaskBoard tasks={tasks} canEdit={canEdit} onStatusChange={vi.fn()} />);

    expect(screen.getByTestId("task-card-1")).toHaveAttribute("data-draggable", "true");
    expect(screen.getByTestId("task-card-2")).toHaveAttribute("data-draggable", "false");
  });

  it("calls onStatusChange when a card is dropped on a different column", () => {
    const tasks = [makeTask(1, ETaskStatus.Todo)];
    const onStatusChange = vi.fn();
    render(<TaskBoard tasks={tasks} canEdit={() => true} onStatusChange={onStatusChange} />);

    capturedOnDragEnd?.({
      active: { id: "1" },
      over: { id: columnDroppableId(ETaskStatus.InProgress) },
    } as DragEndEvent);

    expect(onStatusChange).toHaveBeenCalledWith(tasks[0], ETaskStatus.InProgress);
  });

  it("does nothing when a card is dropped back on its own column", () => {
    const tasks = [makeTask(1, ETaskStatus.Todo)];
    const onStatusChange = vi.fn();
    render(<TaskBoard tasks={tasks} canEdit={() => true} onStatusChange={onStatusChange} />);

    capturedOnDragEnd?.({
      active: { id: "1" },
      over: { id: columnDroppableId(ETaskStatus.Todo) },
    } as DragEndEvent);

    expect(onStatusChange).not.toHaveBeenCalled();
  });

  it("shows an empty-state hint for columns with no cards", () => {
    render(<TaskBoard tasks={[]} canEdit={() => true} onStatusChange={vi.fn()} />);
    expect(screen.getAllByText("Trống")).toHaveLength(Object.values(ETaskStatus).length);
  });
});
