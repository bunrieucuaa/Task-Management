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

import { TagRepository } from './TagRepository';

const BASE = 'http://localhost:8080/api/v1';

beforeEach(() => {
  vi.clearAllMocks();
  axiosMock.get.mockResolvedValue({ data: { success: true, data: { tags: [] } } });
  axiosMock.post.mockResolvedValue({ data: { success: true, data: {} } });
  axiosMock.delete.mockResolvedValue({ data: { success: true } });
});

describe('TagRepository', () => {
  const repo = () => new TagRepository();

  it('listTagsAsync GETs /tags', async () => {
    await repo().listTagsAsync();
    expect(axiosMock.get).toHaveBeenCalledWith(`${BASE}/tags`, { params: {} });
  });

  it('createTagAsync POSTs the name to /tags', async () => {
    await repo().createTagAsync({ name: 'urgent' });
    expect(axiosMock.post).toHaveBeenCalledWith(`${BASE}/tags`, { name: 'urgent' });
  });

  it('deleteTagAsync DELETEs /tags/:id', async () => {
    await repo().deleteTagAsync(7);
    expect(axiosMock.delete).toHaveBeenCalledWith(`${BASE}/tags/7`);
  });

  it('attachToTaskAsync POSTs the tagId to /tasks/:taskId/tags', async () => {
    await repo().attachToTaskAsync(5, 7);
    expect(axiosMock.post).toHaveBeenCalledWith(`${BASE}/tasks/5/tags`, { tagId: 7 });
  });

  it('detachFromTaskAsync DELETEs /tasks/:taskId/tags/:tagId', async () => {
    await repo().detachFromTaskAsync(5, 7);
    expect(axiosMock.delete).toHaveBeenCalledWith(`${BASE}/tasks/5/tags/7`);
  });
});
