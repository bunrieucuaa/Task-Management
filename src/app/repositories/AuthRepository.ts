import {
  BASE_API_URL, 
} from "../core/constants";
import type { IAuth, ITokenEntity } from "../entities/auth.entity";
import type { IUserResponseData } from "../entities/user.entity";
import { BaseApiService } from "./BaseApiService";

export class AuthRepository extends BaseApiService<IAuth> {
  url: string;
  constructor() {
    super(`${BASE_API_URL}/auth`);
    this.url = `${BASE_API_URL}/auth`;
  }

  async getMeAsync() {
    const response = await this.getOtherTypeAsync<IUserResponseData>({
      url: `${this.url}/me`,
      query: {},
    });
    return response;
  }

  async postLoginTokenAsync(value: object) {
    const response = await this.createOtherTypeAsync<ITokenEntity>({
      url: `${this.url}/login`,
      value,
    });
    return response;
  }

  async changePasswordAsync(value: object) {
  return await this.createOtherTypeAsync<null>({
    url: `${this.url}/change-password`,
    value,
  });
  }
  
  async logoutAsync() {
  return await this.createOtherTypeAsync<null>({
    url: `${this.url}/logout`,
    value: {},
  });
}
}
