import {
  ACCESS_TOKEN_NAME,
  BASE_API_URL, 
  REFRESH_TOKEN_NAME,
} from "../core/constants";
import type { IAuth, ITokenEntity } from "../entities/auth.entity";
import type { IUser } from "../entities/user.entity";
import { decrypt, encrypt } from "../shared/config/crypto-js";
import { BaseApiService } from "./BaseApiService";

export class AuthRepository extends BaseApiService<IAuth> {
  url: string;
  constructor() {
    super(`${BASE_API_URL}/auth`);
    this.url = `${BASE_API_URL}/auth`;
  }

  async getMeAsync() {
    const response = await this.getOtherTypeAsync<IUser>({
      url: `${this.url}/me`,
      query: {}
    })
    return response;
  }

  async postLoginTokenAsync(value: object) {
    const response = await this.createOtherTypeAsync<ITokenEntity>({
      url: `${this.url}/login`,
      value,
    });
    return response;
  }

  async refreshTokenAsync() {
    const encryptedRfToken =
      localStorage.getItem(REFRESH_TOKEN_NAME) ||
      sessionStorage.getItem(REFRESH_TOKEN_NAME);
    const refreshToken = decrypt(encryptedRfToken ?? "");

    const response = await this.createOtherTypeAsync<{ accessToken: string }>({
      url: `${this.url}/refresh`,
      value: { refreshToken },
    });
    if (response.success && response.data?.accessToken) {
      const accessToken = encrypt(response.data.accessToken);
      localStorage.setItem(ACCESS_TOKEN_NAME, accessToken);
    }
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
