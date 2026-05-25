import type { IPagination, TypedResponseApi } from "./TypedResponseApi";


export interface IBaseDataSource<T> {
  listAsync(query: Object): Promise<TypedResponseApi<IPagination<T>>>;

  listWithCountAsync<TEntity>(
    query: Object,
  ): Promise<TypedResponseApi<TEntity>>;

  listOTherTypeWithCountAsync<TEntity>(payload: {
    url: string;
    query: Object;
  }): Promise<TypedResponseApi<TEntity>>;
  listOTherTypeAsync<TEntity>(payload: {
    url: string;
    query: Object;
  }): Promise<TypedResponseApi<IPagination<TEntity>>>;

  getAsync(id: string): Promise<TypedResponseApi<T>>;

  getOtherTypeAsync<TEntity>(payload: {
    url: string;
    query: Object;
  }): Promise<TypedResponseApi<TEntity>>;

  createAsync(payload: Object): Promise<TypedResponseApi<T>>;

  createOtherTypeAsync<TEntity>(payload: {
    url: string;
    value: Object;
  }): Promise<TypedResponseApi<TEntity>>;

  updateAsync(id: string, payload: Object): Promise<TypedResponseApi<T>>;

  updateStatusCode204Async(
    id: string,
    payload: Object,
  ): Promise<TypedResponseApi<T>>;

  updateOtherTypeAsync<TEntity>(payload: {
    url: string;
    value: Object;
  }): Promise<TypedResponseApi<TEntity>>;

  updateOtherTypeStatusCode204Async<TEntity>(payload: {
    url: string;
    value: Object;
  }): Promise<TypedResponseApi<TEntity>>;

  removeAsync(id: string): Promise<TypedResponseApi<T>>;

  removeOtherTypeAsync<TEntity>(
    url: string,
  ): Promise<TypedResponseApi<TEntity>>;
}
