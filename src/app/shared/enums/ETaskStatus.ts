export enum ETaskStatus {
  Todo = "TODO",
  InProgress = "IN_PROGRESS",
  Review = "REVIEW",
  Done = "DONE",
  Cancelled = "CANCELLED",
}

export const TASK_STATUS_LABELS: Record<ETaskStatus, string> = {
  [ETaskStatus.Todo]: "To Do",
  [ETaskStatus.InProgress]: "In Progress",
  [ETaskStatus.Review]: "Review",
  [ETaskStatus.Done]: "Done",
  [ETaskStatus.Cancelled]: "Cancelled",
};
