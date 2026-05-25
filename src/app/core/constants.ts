export const BASE_API_URL = import.meta.env.VITE_BASE_API_URL;
export const KEY_LOCAL: string =
  import.meta.env.VITE_KEY_STORAGE || "KEY_LOCAL";
export const ACCESS_TOKEN_NAME: string =
  import.meta.env.ACCESS_TOKEN_NAME || "access_token";
export const REFRESH_TOKEN_NAME: string =
  import.meta.env.REFRESH_TOKEN_NAME || "refresh_token";
export const ACCESS_LANGUAGE: string =
  import.meta.env.ACCESS_LANGUAGE || "Accept-Language";