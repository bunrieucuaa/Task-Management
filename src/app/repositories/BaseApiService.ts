
import BaseApiDataSource from "./BaseApiDataSource";
import type { IBaseDataSource } from "./interfaces/IBaseDataSource";
import type { IPagination, TypedResponseApi } from "./interfaces/TypedResponseApi";


export abstract class BaseApiService<T> implements IBaseDataSource<T> {
  private _url = "";

  constructor(url: string) {
    this._url = url;
  }

  async listAsync(query: Object): Promise<TypedResponseApi<IPagination<T>>> {
    const response = await BaseApiDataSource.get<
      TypedResponseApi<IPagination<T>>
    >(this._url, { ...query });
    return response;
  }

  async listWithCountAsync<TEntity>(
    query: Object,
  ): Promise<TypedResponseApi<TEntity>> {
    const response = await BaseApiDataSource.get<TypedResponseApi<TEntity>>(
      this._url,
      { ...query },
    );
    return response;
  }

  async listOTherTypeWithCountAsync<TEntity>(payload: {
    url: string;
    query: Object;
  }): Promise<TypedResponseApi<TEntity>> {
    const response = await BaseApiDataSource.get<TypedResponseApi<TEntity>>(
      payload.url,
      { ...payload.query },
    );
    return response;
  }

  async listOTherTypeAsync<TEntity>(payload: {
    url: string;
    query: Object;
  }): Promise<TypedResponseApi<IPagination<TEntity>>> {
    const response = await BaseApiDataSource.get<
      TypedResponseApi<IPagination<TEntity>>
    >(`${payload.url}`, {
      ...payload.query,
    });
    return response;
  }

  async listOTherTypeStringAsync<TEntity>(payload: {
    url: string;
  }): Promise<TypedResponseApi<IPagination<TEntity>>> {
    const response = await BaseApiDataSource.get<
      TypedResponseApi<IPagination<TEntity>>
    >(`${payload.url}`);
    return response;
  }

  async getAsync(id: string): Promise<TypedResponseApi<T>> {
    const response = await BaseApiDataSource.get<TypedResponseApi<T>>(
      `${this._url}/${id}`,
    );
    return response;
  }

  async getOtherTypeAsync<TEntity>(payload: {
    url: string;
    query: Object;
  }): Promise<TypedResponseApi<TEntity>> {
    const response = await BaseApiDataSource.get<TypedResponseApi<TEntity>>(
      `${payload.url}`,
      {
        ...payload.query,
      },
    );
    return response;
  }

  createAsync = async (payload: Object): Promise<TypedResponseApi<T>> => {
    const response = await BaseApiDataSource.post<TypedResponseApi<T>>(
      `${this._url}`,
      payload,
    );
    return response;
  };

  async createOtherTypeAsync<TEntity>(payload: {
    url: string;
    value: Object;
  }): Promise<TypedResponseApi<TEntity>> {
    const response = await BaseApiDataSource.post<TypedResponseApi<TEntity>>(
      `${payload.url}`,
      payload.value,
    );
    return response;
  }

  updateAsync = async (
    id: string,
    payload: Object,
  ): Promise<TypedResponseApi<T>> => {
    const response = await BaseApiDataSource.put<TypedResponseApi<T>>(
      `${this._url}/${id}`,
      payload,
    );
    return response;
  };

  async updateStatusCode204Async(
    id: string,
    payload: Object,
  ): Promise<TypedResponseApi<T>> {
    const response = await BaseApiDataSource.putStatusCode204<any>(
      `${this._url}/${id}`,
      payload,
    );
    if (response.status === 204) {
      response.resultCode = 204;
      response.success = true;
    }

    return response as TypedResponseApi<T>;
  }

  async updateOtherTypeAsync<TEntity>(payload: {
    url: string;
    value: Object;
  }): Promise<TypedResponseApi<TEntity>> {
    const response = await BaseApiDataSource.put<TypedResponseApi<TEntity>>(
      `${payload.url}`,
      payload.value,
    );
    return response;
  }

  async updateOtherTypeStatusCode204Async<TEntity>(payload: {
    url: string;
    value: Object;
  }): Promise<TypedResponseApi<TEntity>> {
    const response = await BaseApiDataSource.putStatusCode204<any>(
      `${payload.url}`,
      payload.value,
    );
    if (response.status === 204) {
      response.resultCode = 204;
      response.success = true;
    }

    return response as TypedResponseApi<TEntity>;
  }

  removeAsync = async (id: string): Promise<TypedResponseApi<T>> => {
    const response = await BaseApiDataSource.delete<TypedResponseApi<T>>(
      `${this._url}/${id}`,
    );
    return response;
  };

  async removeOtherTypeAsync<TEntity>(
    url: string,
  ): Promise<TypedResponseApi<TEntity>> {
    const response = await BaseApiDataSource.delete<TypedResponseApi<TEntity>>(
      `${url}`,
    );
    return response;
  }
}
