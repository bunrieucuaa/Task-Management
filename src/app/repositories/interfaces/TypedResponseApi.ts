import type { EResultCode } from "@/app/shared/enums/EResultCode";

export interface TypedResponseApi<T> {
  success: boolean;
  resultCode: EResultCode;
  message: unknown;
  validationErrors: string[];
  data: T;
  error?: string;
}
export interface IPagination<T> {
  page: number;
  size: number;
  count: number;
  results: T[];
}
