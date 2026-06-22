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

import { ActivityRepository } from './ActivityRepository';

const BASE = 'http://localhost:8080/api/v1';

beforeEach(() => {
  vi.clearAllMocks();
  axiosMock.get.mockResolvedValue({
    data: { success: true, data: { data: [], pagination: {} } },
  });
});

describe('ActivityRepository', () => {
  const repo = () => new ActivityRepository();

  it('listByTaskAsync GETs the nested /tasks/:taskId/activities url', async () => {
    await repo().listByTaskAsync(5, { page: 2, limit: 10 });
    expect(axiosMock.get).toHaveBeenCalledWith(`${BASE}/tasks/5/activities`, {
      params: { page: 2, limit: 10 },
    });
  });

  it('listByTaskAsync defaults the query to an empty object', async () => {
    await repo().listByTaskAsync(5);
    expect(axiosMock.get).toHaveBeenCalledWith(`${BASE}/tasks/5/activities`, { params: {} });
  });
});
