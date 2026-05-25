import { ACCESS_LANGUAGE } from "./../../core/constants";
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import {
  ACCESS_TOKEN_NAME,
  BASE_API_URL,
  REFRESH_TOKEN_NAME,
} from "../../core/constants";
import { EResultCode } from "../enums/EResultCode";
import { jwtDecode ,type JwtPayload } from "jwt-decode";
import { decrypt } from "./crypto-js";
// import { AuthRepository } from "../../repositories/AuthRepository";
// import { ELanguage } from "../enums/ELanguage";

const TIMEOUT = 1 * 60 * 1000;
axios.defaults.timeout = TIMEOUT;
axios.defaults.baseURL = BASE_API_URL || "http://localhost:8080/api/v1";

const onRequestSuccess = (config: InternalAxiosRequestConfig<any>) => {
//   let languagetoLocalStorage: ELanguage;
  const tokenEncode =
    localStorage.getItem(ACCESS_TOKEN_NAME) ||
    sessionStorage.getItem(ACCESS_TOKEN_NAME);

//   try {
//     languagetoLocalStorage = localStorage.getItem(ACCESS_LANGUAGE) as ELanguage;
//   } catch (error) {
//     console.error("Error retrieving language from localStorage:", error);
//     languagetoLocalStorage = ELanguage.Vi;
//   }

//   config.headers[ACCESS_LANGUAGE] = languagetoLocalStorage;

  const token = decrypt(tokenEncode ?? "");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.url === `${EDUSOFT}/auth/login`) {
    const refreshTokenEndcode =
      localStorage.getItem(REFRESH_TOKEN_NAME) ||
      sessionStorage.getItem(REFRESH_TOKEN_NAME);

    const refreshToken = decrypt(refreshTokenEndcode ?? "");
    config.headers.refreshToken = refreshToken;
  }
  return config;
};

const setupAxiosInterceptors = (onUnauthenticated: () => void) => {
  const onResponseError = async (err: AxiosError) => {
    const status = err.response?.status || err.status;
    // if (status === 403 || status === 401) {
    //   onUnauthenticated();
    // }
    const config = err.config || {};
    const tokenEncode =
      localStorage.getItem(ACCESS_TOKEN_NAME) ||
      sessionStorage.getItem(ACCESS_TOKEN_NAME);

    const token = decrypt(tokenEncode ?? "");
    if (
      status === Number(EResultCode.UNAUTHORIZED) &&
      !checkTokenValidity(token)
    ) {
      await new AuthRepository().refreshTokenAsync();
      return await axios.request(config);
    } else if (status === Number(EResultCode.FORBIDDEN)) {
      onUnauthenticated();
    }
    return Promise.reject(err);
  };
  if (axios.interceptors) {
    axios.interceptors.request.use(onRequestSuccess);
    axios.interceptors.response.use((res) => res, onResponseError);
  }
  axios.interceptors.request.use((config) => {
    return config;
  });
};

function checkTokenValidity(token: string) {
  if (token) {
    const decodedToken = jwtDecode<JwtPayload>(token);
    return decodedToken.exp && decodedToken.exp * 1000 > new Date().getTime();
  }
  return false;
}

export { onRequestSuccess, setupAxiosInterceptors };
