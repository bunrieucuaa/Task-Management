import type { IProjectUserSummary } from "./project.entity";

export type TActivityAction =
  | "TASK_CREATED"
  | "STATUS_CHANGED"
  | "ASSIGNEE_CHANGED"
  | "DEADLINE_CHANGED"
  | "PRIORITY_CHANGED"
  | "TAG_ADDED"
  | "TAG_REMOVED";

/** A JSON snapshot of the changed field(s); shape depends on the action. */
export type TActivityValue = Record<string, unknown> | null;

export interface IActivity {
  id: number;
  taskId: number | null;
  userId: number | null;
  action: TActivityAction;
  oldValue: TActivityValue;
  newValue: TActivityValue;
  createdAt: string;
  user: IProjectUserSummary | null;
}

export interface IActivityListQuery {
  page?: number;
  limit?: number;
}

export interface IActivityPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** GET /tasks/:taskId/activities → { data, pagination } */
export interface IActivityListData {
  data: IActivity[];
  pagination: IActivityPagination;
}
