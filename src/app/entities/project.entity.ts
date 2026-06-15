import { EProjectStatus } from "@/app/shared/enums/EProjectStatus";

export interface IProjectUserSummary {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface IProjectMember {
  id: number;
  userId: number;
  role: string;
  joinedAt: string;
  user: IProjectUserSummary;
}

export interface IProject {
  id: number;
  name: string;
  description: string | null;
  ownerId: number | null;
  status: EProjectStatus;
  createdAt: string;
  updatedAt: string;
  owner: IProjectUserSummary | null;
  _count?: { members: number; tasks: number };
  members?: IProjectMember[];
}

export interface IProjectListQuery {
  page: number;
  limit: number;
  search?: string;
  status?: EProjectStatus | "";
  sortBy?: "name" | "status" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface IProjectPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IProjectListData {
  data: IProject[];
  pagination: IProjectPagination;
}

export interface IProjectResponseData {
  project: IProject;
}

export interface IProjectMembersData {
  members: IProjectMember[];
}

export interface IProjectMemberData {
  member: IProjectMember;
}

export interface ICreateProjectPayload {
  name: string;
  description?: string;
  memberIds?: number[];
}

export interface IUpdateProjectPayload {
  name?: string;
  description?: string | null;
  status?: EProjectStatus;
}

export interface IAddMemberPayload {
  email: string;
}
