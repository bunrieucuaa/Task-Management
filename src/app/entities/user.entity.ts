import { ERole } from "@/app/shared/enums/ERole";
import { EUserStatus } from "@/app/shared/enums/EUserStatus";

export interface IUser {
  id: number;
  name: string;
  email: string;
  role: ERole;
  status: EUserStatus;
  avatarUrl: string | null;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IUserListQuery {
  page: number;
  limit: number;
  search?: string;
  role?: ERole | "";
  status?: EUserStatus | "";
  sortBy?: "name" | "email" | "role" | "status" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface IUserPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IUserListData {
  data: IUser[];
  pagination: IUserPagination;
}

export interface IUserResponseData {
  user: IUser;
}

export interface IUserWithTemporaryPasswordData {
  user: IUser;
  temporaryPassword: string;
}

export interface ICreateUserPayload {
  name: string;
  email: string;
  role?: ERole;
}

export interface IUpdateUserProfilePayload {
  name?: string;
  avatarUrl?: string | null;
}

export interface IUpdateUserStatusPayload {
  status: EUserStatus;
}

export interface IUserDirectoryItem {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: ERole;
}

export interface IUserDirectoryData {
  users: IUserDirectoryItem[];
}
