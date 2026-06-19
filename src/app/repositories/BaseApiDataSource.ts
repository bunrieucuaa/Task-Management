import axios, { AxiosError, type AxiosResponse } from "axios";
import { toast } from "sonner";
import type { TypedResponseApi } from "./interfaces/TypedResponseApi";


const processError = <T>(error: AxiosError): T => {
  const { code, message, response } = error;
  console.error(`StatusCode: ${code} - ${message}`);
  const data = (response?.data ?? {}) as TypedResponseApi<T>;
  toast.error(`${data?.message ?? "Error system"}`,{position: "bottom-right"});
  return (response?.data ?? {}) as T;
};

const responseBody = <T>(res: AxiosResponse<unknown>): T => res.data as T;

const BaseApiDataSource = {
  get: <T>(url: string, params?: object) => {
    return axios
      .get(url, { params })
      .then((response) => responseBody<T>(response))
      .catch((error: AxiosError) => processError<T>(error));
  },

  post: <T>(url: string, data: unknown) =>
    axios
      .post(url, data)
      .then((response) => responseBody<T>(response))
      .catch((error: AxiosError) => processError<T>(error)),

  put: <T>(url: string, data: unknown) =>
    axios
      .put(url, data)
      .then((response) => responseBody<T>(response))
      .catch((error: AxiosError) => processError<T>(error)),

  patch: <T>(url: string, data: unknown) =>
    axios
      .patch(url, data)
      .then((response) => responseBody<T>(response))
      .catch((error: AxiosError) => processError<T>(error)),

  putStatusCode204: <T>(url: string, data: unknown) =>
    axios
      .put(url, data)
      .then((response) => response)
      .catch((error: AxiosError) => processError<T>(error)),

  delete: <T>(url: string) =>
    axios
      .delete(url)
      .then((response) => responseBody<T>(response))
      .catch((error: AxiosError) => processError<T>(error)),

  postWithFile: <T>(url: string, data: unknown) =>
    axios
      .post(url, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => responseBody<T>(response))
      .catch((error: AxiosError) => processError<T>(error)),
};
export default BaseApiDataSource;
