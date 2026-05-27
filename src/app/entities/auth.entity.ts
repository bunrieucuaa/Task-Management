import type { IUser } from "./user.entity";

export interface IAuth {
  email: string;
  password: string;
}

export interface ITokenEntity {
  refreshToken: string;
  accessToken: string;
  roles: string;
  user: IUser;
  mustChangePassword: boolean;
}
