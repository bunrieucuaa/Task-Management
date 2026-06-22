import { format } from "date-fns";
import type { IActivity } from "@/app/entities/activity.entity";
import { ETaskStatus, TASK_STATUS_LABELS } from "@/app/shared/enums/ETaskStatus";
import { ETaskPriority, TASK_PRIORITY_LABELS } from "@/app/shared/enums/ETaskPriority";

const statusLabel = (raw: unknown): string =>
  TASK_STATUS_LABELS[raw as ETaskStatus] ?? String(raw ?? "—");

const priorityLabel = (raw: unknown): string =>
  TASK_PRIORITY_LABELS[raw as ETaskPriority] ?? String(raw ?? "—");

const deadlineLabel = (raw: unknown): string => {
  if (!raw) return "không có";
  const date = new Date(String(raw));
  return Number.isNaN(date.getTime()) ? String(raw) : format(date, "dd/MM/yyyy");
};

/**
 * Map an activity-log entry to a human-readable Vietnamese sentence.
 * The actor's name is rendered by the timeline; this returns only the action.
 */
export function describeActivity(activity: IActivity): string {
  const oldV = activity.oldValue ?? {};
  const newV = activity.newValue ?? {};

  switch (activity.action) {
    case "TASK_CREATED":
      return "đã tạo công việc này";
    case "STATUS_CHANGED":
      return `đã đổi trạng thái từ ${statusLabel(oldV.status)} → ${statusLabel(newV.status)}`;
    case "PRIORITY_CHANGED":
      return `đã đổi độ ưu tiên từ ${priorityLabel(oldV.priority)} → ${priorityLabel(newV.priority)}`;
    case "ASSIGNEE_CHANGED":
      return newV.assigneeId == null
        ? "đã bỏ người phụ trách"
        : "đã đổi người phụ trách";
    case "DEADLINE_CHANGED":
      return `đã đổi hạn chót từ ${deadlineLabel(oldV.deadline)} → ${deadlineLabel(newV.deadline)}`;
    case "TAG_ADDED":
      return "đã gắn nhãn";
    case "TAG_REMOVED":
      return "đã gỡ nhãn";
    default:
      return "đã cập nhật công việc";
  }
}
