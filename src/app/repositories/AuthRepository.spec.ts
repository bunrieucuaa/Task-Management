import { describe, it, expect, beforeEach, vi } from 'vitest';

const axiosMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('axios', () => ({ default: axiosMock }));

const toastMock = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock('sonner', () => ({ toast: toastMock }));

import { AuthRepository } from './AuthRepository';

const BASE = 'http://localhost:8080/api/v1';

beforeEach(() => vi.clearAllMocks());

describe('AuthRepository', () => {
  it('postLoginTokenAsync POSTs to /auth/login and returns the response body', async () => {
    const body = { success: true, data: { accessToken: 'a', refreshToken: 'r' } };
    axiosMock.post.mockResolvedValue({ data: body });

    const result = await new AuthRepository().postLoginTokenAsync({ email: 'a@b.com', password: 'x' });

    expect(axiosMock.post).toHaveBeenCalledWith(`${BASE}/auth/login`, { email: 'a@b.com', password: 'x' });
    expect(result).toEqual(body);
  });

  it('getMeAsync GETs /auth/me', async () => {
    axiosMock.get.mockResolvedValue({ data: { success: true, data: { user: { id: 1 } } } });
    const result = await new AuthRepository().getMeAsync();
    expect(axiosMock.get).toHaveBeenCalledWith(`${BASE}/auth/me`, { params: {} });
    expect(result.data.user).toMatchObject({ id: 1 });
  });

  it('changePasswordAsync POSTs to /auth/change-password', async () => {
    axiosMock.post.mockResolvedValue({ data: { success: true } });
    await new AuthRepository().changePasswordAsync({ oldPassword: 'o', newPassword: 'n' });
    expect(axiosMock.post).toHaveBeenCalledWith(`${BASE}/auth/change-password`, {
      oldPassword: 'o',
      newPassword: 'n',
    });
  });

  it('logoutAsync POSTs an empty body to /auth/logout', async () => {
    axiosMock.post.mockResolvedValue({ data: { success: true } });
    await new AuthRepository().logoutAsync();
    expect(axiosMock.post).toHaveBeenCalledWith(`${BASE}/auth/logout`, {});
  });

  it('surfaces server error body and toasts on failure', async () => {
    axiosMock.post.mockRejectedValue({
      code: 'ERR_BAD_REQUEST',
      message: 'Request failed',
      response: { data: { success: false, message: 'Invalid credentials' } },
    });

    const result = await new AuthRepository().postLoginTokenAsync({ email: 'a@b.com', password: 'bad' });

    expect(result).toMatchObject({ success: false, message: 'Invalid credentials' });
    expect(toastMock.error).toHaveBeenCalledWith('Invalid credentials', expect.objectContaining({ position: 'bottom-right' }));
  });
});
