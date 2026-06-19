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

import { TaskRepository } from './TaskRepository';

const BASE = 'http://localhost:8080/api/v1';

beforeEach(() => {
  vi.clearAllMocks();
  axiosMock.get.mockResolvedValue({ data: { success: true, data: {} } });
  axiosMock.post.mockResolvedValue({ data: { success: true, data: {} } });
  axiosMock.patch.mockResolvedValue({ data: { success: true, data: {} } });
  axiosMock.delete.mockResolvedValue({ data: { success: true } });
});

describe('TaskRepository', () => {
  const repo = () => new TaskRepository();

  it('listTasksAsync GETs /tasks with the query as params', async () => {
    await repo().listTasksAsync({ page: 1, status: 'TODO' } as never);
    expect(axiosMock.get).toHaveBeenCalledWith(`${BASE}/tasks`, { params: { page: 1, status: 'TODO' } });
  });

  it('getTaskByIdAsync GETs /tasks/:id', async () => {
    await repo().getTaskByIdAsync('5');
    expect(axiosMock.get).toHaveBeenCalledWith(`${BASE}/tasks/5`, { params: {} });
  });

  it('createTaskAsync POSTs to /tasks', async () => {
    await repo().createTaskAsync({ title: 'T', projectId: 1 } as never);
    expect(axiosMock.post).toHaveBeenCalledWith(`${BASE}/tasks`, { title: 'T', projectId: 1 });
  });

  it('updateTaskAsync PATCHes /tasks/:id', async () => {
    await repo().updateTaskAsync('5', { title: 'Updated' } as never);
    expect(axiosMock.patch).toHaveBeenCalledWith(`${BASE}/tasks/5`, { title: 'Updated' });
  });

  it('deleteTaskAsync DELETEs /tasks/:id', async () => {
    await repo().deleteTaskAsync('5');
    expect(axiosMock.delete).toHaveBeenCalledWith(`${BASE}/tasks/5`);
  });
});
