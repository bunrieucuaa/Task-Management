import type { IProjectUserSummary } from "./project.entity";

export interface IComment {
  id: number;
  taskId: number | null;
  userId: number | null;
  content: string;
  createdAt: string;
  user: IProjectUserSummary | null;
}

export interface ICommentListQuery {
  page?: number;
  limit?: number;
}

export interface ICommentPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ICommentListData {
  data: IComment[];
  pagination: ICommentPagination;
}

export interface ICommentResponseData {
  comment: IComment;
}

export interface ICreateCommentPayload {
  content: string;
}
