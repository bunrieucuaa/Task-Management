import { ETaskPriority } from "@/app/shared/enums/ETaskPriority";
import { ETaskStatus } from "@/app/shared/enums/ETaskStatus";
import type { IProjectUserSummary } from "./project.entity";

export interface ITask {
  id: number;
  title: string;
  description: string | null;
  projectId: number | null;
  creatorId: number | null;
  assigneeId: number | null;
  status: ETaskStatus;
  priority: ETaskPriority;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
  creator: IProjectUserSummary | null;
  assignee: IProjectUserSummary | null;
  project: { id: number; name: string } | null;
}

export interface ITaskListQuery {
  page: number;
  limit: number;
  projectId?: number | "";
  assigneeId?: number | "";
  status?: ETaskStatus | "";
  priority?: ETaskPriority | "";
  deadlineFrom?: string;
  deadlineTo?: string;
  search?: string;
  sortBy?: "title" | "status" | "priority" | "deadline" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface ITaskPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ITaskListData {
  data: ITask[];
  pagination: ITaskPagination;
}

export interface ITaskResponseData {
  task: ITask;
}

export interface ICreateTaskPayload {
  title: string;
  description?: string;
  projectId: number;
  assigneeId?: number | null;
  priority?: ETaskPriority;
  deadline?: string | null;
}

export interface IUpdateTaskPayload {
  title?: string;
  description?: string | null;
  assigneeId?: number | null;
  status?: ETaskStatus;
  priority?: ETaskPriority;
  deadline?: string | null;
}
