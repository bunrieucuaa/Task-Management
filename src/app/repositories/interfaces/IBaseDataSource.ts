import type { IPagination, TypedResponseApi } from "./TypedResponseApi";


export interface IBaseDataSource<T> {
  listAsync(query: object): Promise<TypedResponseApi<IPagination<T>>>;

  listWithCountAsync<TEntity>(
    query: object,
  ): Promise<TypedResponseApi<TEntity>>;

  listOTherTypeWithCountAsync<TEntity>(payload: {
    url: string;
    query: object;
  }): Promise<TypedResponseApi<TEntity>>;
  listOTherTypeAsync<TEntity>(payload: {
    url: string;
    query: object;
  }): Promise<TypedResponseApi<IPagination<TEntity>>>;

  getAsync(id: string): Promise<TypedResponseApi<T>>;

  getOtherTypeAsync<TEntity>(payload: {
    url: string;
    query: object;
  }): Promise<TypedResponseApi<TEntity>>;

  createAsync(payload: object): Promise<TypedResponseApi<T>>;

  createOtherTypeAsync<TEntity>(payload: {
    url: string;
    value: object;
  }): Promise<TypedResponseApi<TEntity>>;

  updateAsync(id: string, payload: object): Promise<TypedResponseApi<T>>;

  patchAsync(id: string, payload: object): Promise<TypedResponseApi<T>>;

  updateStatusCode204Async(
    id: string,
    payload: object,
  ): Promise<TypedResponseApi<T>>;

  updateOtherTypeAsync<TEntity>(payload: {
    url: string;
    value: object;
  }): Promise<TypedResponseApi<TEntity>>;

  patchOtherTypeAsync<TEntity>(payload: {
    url: string;
    value: object;
  }): Promise<TypedResponseApi<TEntity>>;

  updateOtherTypeStatusCode204Async<TEntity>(payload: {
    url: string;
    value: object;
  }): Promise<TypedResponseApi<TEntity>>;

  removeAsync(id: string): Promise<TypedResponseApi<T>>;

  removeOtherTypeAsync<TEntity>(
    url: string,
  ): Promise<TypedResponseApi<TEntity>>;
}
