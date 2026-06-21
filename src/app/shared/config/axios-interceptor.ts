// import { ACCESS_LANGUAGE } from "./../../core/constants";
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import {
  ACCESS_TOKEN_NAME,
  BASE_API_URL,
  REFRESH_TOKEN_NAME,
} from "../../core/constants";
import { EResultCode } from "../enums/EResultCode";

const TIMEOUT = 1 * 60 * 1000;
axios.defaults.timeout = TIMEOUT;
axios.defaults.baseURL = BASE_API_URL;

// Instance KHÔNG có interceptor — dùng riêng cho /auth/refresh
// để tránh vòng lặp vô tận khi refresh thất bại
const axiosPublic = axios.create({
  baseURL: BASE_API_URL,
  timeout: TIMEOUT,
});

// Mở rộng kiểu config để thêm cờ _retry
interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const onRequestSuccess = (config: InternalAxiosRequestConfig<unknown>) => {
  const token =
    localStorage.getItem(ACCESS_TOKEN_NAME) ||
    sessionStorage.getItem(ACCESS_TOKEN_NAME);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// Gọi /auth/refresh qua axiosPublic — KHÔNG đi qua interceptor response
async function callRefreshToken(): Promise<string | null> {
  try {
    const refreshToken =
      localStorage.getItem(REFRESH_TOKEN_NAME) ||
      sessionStorage.getItem(REFRESH_TOKEN_NAME);

    if (!refreshToken) {
      console.warn("[Interceptor] Không tìm thấy refresh token trong storage");
      return null;
    }

    const response = await axiosPublic.post<{
      success: boolean;
      data: { accessToken: string };
    }>("/auth/refresh", { refreshToken });

    if (response.data?.success && response.data.data?.accessToken) {
      localStorage.setItem(ACCESS_TOKEN_NAME, response.data.data.accessToken);
      return response.data.data.accessToken;
    }
    return null;
  } catch (err) {
    console.error("[Interceptor] Refresh token thất bại:", err);
    return null;
  }
}

const setupAxiosInterceptors = (onUnauthenticated: () => void) => {
  const onResponseError = async (err: AxiosError) => {
    const status = err.response?.status || err.status;
    const config = err.config as RetryConfig | undefined;

    // Chỉ thử refresh một lần — nếu config đã có _retry=true thì bỏ qua
    if (status === Number(EResultCode.UNAUTHORIZED) && config && !config._retry) {
      config._retry = true;

      const newAccessToken = await callRefreshToken();

      if (newAccessToken) {
        // Cập nhật token mới vào header của request cũ rồi retry
        config.headers.Authorization = `Bearer ${newAccessToken}`;
        return axios.request(config);
      }

      // Refresh thất bại → đăng xuất
      console.warn("[Interceptor] Refresh thất bại → đăng xuất");
      onUnauthenticated();
      return Promise.reject(err);
    }

    // 403 từ các route được bảo vệ → đăng xuất
    // Bỏ qua /auth/login để tránh logout khi login có mustChangePassword
    if (status === Number(EResultCode.FORBIDDEN)) {
      const url = config?.url ?? "";
      if (!url.includes("/auth/login")) {
        onUnauthenticated();
      }
    }

    return Promise.reject(err);
  };

  axios.interceptors.request.use(onRequestSuccess);
  axios.interceptors.response.use((res) => res, onResponseError);
};

export { onRequestSuccess, setupAxiosInterceptors };
