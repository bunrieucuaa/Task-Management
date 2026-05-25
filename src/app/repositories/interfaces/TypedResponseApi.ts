import type { EResultCode } from "@/app/shared/enums/EResultCode";

export interface TypedResponseApi<T> {
  success: boolean;
  resultCode: EResultCode;
  message: any;
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
