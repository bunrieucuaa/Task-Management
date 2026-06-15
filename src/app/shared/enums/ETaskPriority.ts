export enum ETaskPriority {
  Low = "LOW",
  Medium = "MEDIUM",
  High = "HIGH",
  Urgent = "URGENT",
}

export const TASK_PRIORITY_LABELS: Record<ETaskPriority, string> = {
  [ETaskPriority.Low]: "Low",
  [ETaskPriority.Medium]: "Medium",
  [ETaskPriority.High]: "High",
  [ETaskPriority.Urgent]: "Urgent",
};
