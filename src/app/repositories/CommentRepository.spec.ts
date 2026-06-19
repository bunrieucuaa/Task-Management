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

import { CommentRepository } from './CommentRepository';

const BASE = 'http://localhost:8080/api/v1';

beforeEach(() => {
  vi.clearAllMocks();
  axiosMock.get.mockResolvedValue({ data: { success: true, data: {} } });
  axiosMock.post.mockResolvedValue({ data: { success: true, data: {} } });
  axiosMock.delete.mockResolvedValue({ data: { success: true } });
});

describe('CommentRepository', () => {
  const repo = () => new CommentRepository();

  it('listCommentsAsync GETs the nested /tasks/:taskId/comments url', async () => {
    await repo().listCommentsAsync(5, { page: 1 } as never);
    expect(axiosMock.get).toHaveBeenCalledWith(`${BASE}/tasks/5/comments`, { params: { page: 1 } });
  });

  it('listCommentsAsync defaults the query to an empty object', async () => {
    await repo().listCommentsAsync(5);
    expect(axiosMock.get).toHaveBeenCalledWith(`${BASE}/tasks/5/comments`, { params: {} });
  });

  it('createCommentAsync POSTs to the nested comments url', async () => {
    await repo().createCommentAsync(5, { content: 'hi' } as never);
    expect(axiosMock.post).toHaveBeenCalledWith(`${BASE}/tasks/5/comments`, { content: 'hi' });
  });

  it('deleteCommentAsync DELETEs /tasks/:taskId/comments/:commentId', async () => {
    await repo().deleteCommentAsync(5, 9);
    expect(axiosMock.delete).toHaveBeenCalledWith(`${BASE}/tasks/5/comments/9`);
  });
});
