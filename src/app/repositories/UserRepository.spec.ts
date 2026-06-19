import { describe, it, expect, beforeEach, vi } from 'vitest';

const axiosMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));
vi.mock('axios', () => ({ default: axiosMock }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { UserRepository } from './UserRepository';

const BASE = 'http://localhost:8080/api/v1';

beforeEach(() => {
  vi.clearAllMocks();
  axiosMock.get.mockResolvedValue({ data: { success: true, data: {} } });
  axiosMock.post.mockResolvedValue({ data: { success: true, data: {} } });
  axiosMock.patch.mockResolvedValue({ data: { success: true, data: {} } });
  axiosMock.delete.mockResolvedValue({ data: { success: true } });
});

describe('UserRepository', () => {
  const repo = () => new UserRepository();

  it('listUsersAsync GETs /users with the query as params', async () => {
    await repo().listUsersAsync({ page: 1, role: 'ADMIN' } as never);
    expect(axiosMock.get).toHaveBeenCalledWith(`${BASE}/users`, { params: { page: 1, role: 'ADMIN' } });
  });

  it('createUserAsync POSTs to /users', async () => {
    await repo().createUserAsync({ name: 'A', email: 'a@e.com' } as never);
    expect(axiosMock.post).toHaveBeenCalledWith(`${BASE}/users`, { name: 'A', email: 'a@e.com' });
  });

  it('getDirectoryAsync GETs /users/directory', async () => {
    await repo().getDirectoryAsync();
    expect(axiosMock.get).toHaveBeenCalledWith(`${BASE}/users/directory`, { params: {} });
  });

  it('getUserByIdAsync GETs /users/:id', async () => {
    await repo().getUserByIdAsync('3');
    expect(axiosMock.get).toHaveBeenCalledWith(`${BASE}/users/3`, { params: {} });
  });

  it('updateProfileAsync PATCHes /users/:id', async () => {
    await repo().updateProfileAsync('3', { name: 'New' } as never);
    expect(axiosMock.patch).toHaveBeenCalledWith(`${BASE}/users/3`, { name: 'New' });
  });

  it('updateUserStatusAsync PATCHes /users/:id/status', async () => {
    await repo().updateUserStatusAsync('3', { status: 'BLOCKED' } as never);
    expect(axiosMock.patch).toHaveBeenCalledWith(`${BASE}/users/3/status`, { status: 'BLOCKED' });
  });

  it('resetUserPasswordAsync POSTs an empty body to /users/:id/reset-password', async () => {
    await repo().resetUserPasswordAsync('3');
    expect(axiosMock.post).toHaveBeenCalledWith(`${BASE}/users/3/reset-password`, {});
  });

  it('deleteUserAsync DELETEs /users/:id', async () => {
    await repo().deleteUserAsync('3');
    expect(axiosMock.delete).toHaveBeenCalledWith(`${BASE}/users/3`);
  });
});
