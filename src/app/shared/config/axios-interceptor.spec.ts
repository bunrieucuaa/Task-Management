import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME } from '@/app/core/constants';

// The interceptor wires itself onto the default axios instance and refreshes
// through a separate `axios.create()` instance. We mock axios to capture the
// registered response-error handler and drive it directly.
const h = vi.hoisted(() => {
  const axiosPublicMock = { post: vi.fn() };
  const requestMock = vi.fn();
  const state = { onError: null as null | ((e: unknown) => unknown) };
  const axiosDefault = {
    defaults: {} as Record<string, unknown>,
    create: vi.fn(() => axiosPublicMock),
    request: requestMock,
    interceptors: {
      request: { use: vi.fn() },
      response: {
        use: vi.fn((_ok: unknown, err: (e: unknown) => unknown) => {
          state.onError = err;
        }),
      },
    },
  };
  return { axiosPublicMock, requestMock, state, axiosDefault };
});

vi.mock('axios', () => ({
  default: h.axiosDefault,
  AxiosError: class AxiosError extends Error {},
}));

import { setupAxiosInterceptors } from './axios-interceptor';

let onUnauthenticated: ReturnType<typeof vi.fn>;

const fireError = (err: unknown) => h.state.onError!(err);

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  onUnauthenticated = vi.fn();
  setupAxiosInterceptors(onUnauthenticated);
});

describe('axios response interceptor — 401 refresh flow', () => {
  it('refreshes once and retries the original request with the new token', async () => {
    localStorage.setItem(REFRESH_TOKEN_NAME, 'refresh-abc');
    h.axiosPublicMock.post.mockResolvedValue({
      data: { success: true, data: { accessToken: 'new-token' } },
    });
    h.requestMock.mockResolvedValue('RETRY_RESULT');

    const config = { headers: {} as Record<string, string> };
    const result = await fireError({ response: { status: 401 }, config });

    expect(h.axiosPublicMock.post).toHaveBeenCalledWith('/auth/refresh', {
      refreshToken: 'refresh-abc',
    });
    // Retried with the refreshed token, and the new access token is persisted.
    expect(config.headers.Authorization).toBe('Bearer new-token');
    expect(h.requestMock).toHaveBeenCalledWith(config);
    expect(result).toBe('RETRY_RESULT');
    expect(localStorage.getItem(ACCESS_TOKEN_NAME)).toBe('new-token');
    expect(onUnauthenticated).not.toHaveBeenCalled();
  });

  it('logs out when the refresh call fails', async () => {
    localStorage.setItem(REFRESH_TOKEN_NAME, 'refresh-abc');
    h.axiosPublicMock.post.mockRejectedValue(new Error('refresh boom'));

    const err = { response: { status: 401 }, config: { headers: {} } };
    await expect(fireError(err)).rejects.toBe(err);
    expect(onUnauthenticated).toHaveBeenCalledTimes(1);
    expect(h.requestMock).not.toHaveBeenCalled();
  });

  it('logs out when there is no stored refresh token', async () => {
    const err = { response: { status: 401 }, config: { headers: {} } };
    await expect(fireError(err)).rejects.toBe(err);
    expect(h.axiosPublicMock.post).not.toHaveBeenCalled();
    expect(onUnauthenticated).toHaveBeenCalledTimes(1);
  });

  it('does not retry a request that already carries _retry (refresh only once)', async () => {
    localStorage.setItem(REFRESH_TOKEN_NAME, 'refresh-abc');
    const err = { response: { status: 401 }, config: { headers: {}, _retry: true } };
    await expect(fireError(err)).rejects.toBe(err);
    expect(h.axiosPublicMock.post).not.toHaveBeenCalled();
    expect(onUnauthenticated).not.toHaveBeenCalled();
  });
});

describe('axios response interceptor — 403 handling', () => {
  it('logs out on a 403 from a protected route', async () => {
    const err = { response: { status: 403 }, config: { url: '/users' } };
    await expect(fireError(err)).rejects.toBe(err);
    expect(onUnauthenticated).toHaveBeenCalledTimes(1);
  });

  it('does not log out on a 403 from /auth/login (mustChangePassword case)', async () => {
    const err = { response: { status: 403 }, config: { url: '/auth/login' } };
    await expect(fireError(err)).rejects.toBe(err);
    expect(onUnauthenticated).not.toHaveBeenCalled();
  });
});
