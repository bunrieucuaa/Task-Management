import { BASE_API_URL } from "../core/constants";
import type {
  ICreateUserPayload,
  IUpdateUserProfilePayload,
  IUpdateUserStatusPayload,
  IUser,
  IUserListData,
  IUserListQuery,
  IUserResponseData,
  IUserWithTemporaryPasswordData,
} from "../entities/user.entity";
import { BaseApiService } from "./BaseApiService";

export class UserRepository extends BaseApiService<IUser> {
  url: string;

  constructor() {
    super(`${BASE_API_URL}/users`);
    this.url = `${BASE_API_URL}/users`;
  }

  async createUserAsync(value: ICreateUserPayload) {
    return await this.createOtherTypeAsync<IUserWithTemporaryPasswordData>({
      url: this.url,
      value,
    });
  }

  async listUsersAsync(query: IUserListQuery) {
    return await this.listWithCountAsync<IUserListData>(query);
  }

  async getUserByIdAsync(id: string) {
    return await this.getOtherTypeAsync<IUserResponseData>({
      url: `${this.url}/${id}`,
      query: {},
    });
  }

  async updateProfileAsync(id: string, value: IUpdateUserProfilePayload) {
    return await this.patchOtherTypeAsync<IUserResponseData>({
      url: `${this.url}/${id}`,
      value,
    });
  }

  async updateUserStatusAsync(id: string, value: IUpdateUserStatusPayload) {
    return await this.patchOtherTypeAsync<IUserResponseData>({
      url: `${this.url}/${id}/status`,
      value,
    });
  }

  async resetUserPasswordAsync(id: string) {
    return await this.createOtherTypeAsync<IUserWithTemporaryPasswordData>({
      url: `${this.url}/${id}/reset-password`,
      value: {},
    });
  }

  async deleteUserAsync(id: string) {
    return await this.removeOtherTypeAsync<null>(`${this.url}/${id}`);
  }
}
