import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

const mocks = vi.hoisted(() => ({
  listCommentsAsync: vi.fn(),
  createCommentAsync: vi.fn(),
  deleteCommentAsync: vi.fn(),
}));

vi.mock('@/app/repositories/CommentRepository', () => ({
  CommentRepository: vi.fn(() => mocks),
}));

import reducer, {
  clearComments,
  fetchComments,
  createComment,
  deleteComment,
} from './commentsSlice';

const makeStore = (preloaded?: Record<string, unknown>) =>
  configureStore({
    reducer: { comments: reducer },
    preloadedState: preloaded ? ({ comments: preloaded } as never) : undefined,
  });

const baseState = {
  items: [] as unknown[],
  taskId: null as number | null,
  loading: false,
  submitting: false,
};

beforeEach(() => vi.clearAllMocks());

describe('commentsSlice reducers', () => {
  it('clearComments resets the slice', () => {
    const state = reducer(
      { items: [{ id: 1 }], taskId: 5, loading: true, submitting: true } as never,
      clearComments(),
    );
    expect(state).toEqual({ items: [], taskId: null, loading: false, submitting: false });
  });
});

describe('fetchComments thunk', () => {
  it('stores items and the owning taskId on success', async () => {
    mocks.listCommentsAsync.mockResolvedValue({
      success: true,
      data: { data: [{ id: 1, content: 'hi' }] },
    });
    const store = makeStore();
    await store.dispatch(fetchComments(5));
    expect(store.getState().comments.taskId).toBe(5);
    expect(store.getState().comments.items).toHaveLength(1);
    expect(store.getState().comments.loading).toBe(false);
  });

  it('clears stale items when switching to a different task (pending)', async () => {
    // Never resolves so we can observe the pending-phase reset.
    mocks.listCommentsAsync.mockReturnValue(new Promise(() => {}));
    const store = makeStore({ ...baseState, items: [{ id: 99 }], taskId: 1 });
    store.dispatch(fetchComments(2));
    expect(store.getState().comments.items).toEqual([]);
    expect(store.getState().comments.taskId).toBe(2);
    expect(store.getState().comments.loading).toBe(true);
  });
});

describe('createComment thunk', () => {
  it('appends the created comment at the end', async () => {
    mocks.createCommentAsync.mockResolvedValue({
      success: true,
      data: { comment: { id: 2, content: 'new' } },
    });
    const store = makeStore({ ...baseState, items: [{ id: 1, content: 'old' }], taskId: 5 });
    await store.dispatch(createComment({ taskId: 5, content: 'new' }));
    expect(store.getState().comments.items).toHaveLength(2);
    expect(store.getState().comments.items.at(-1)).toMatchObject({ id: 2 });
    expect(store.getState().comments.submitting).toBe(false);
  });
});

describe('deleteComment thunk', () => {
  it('removes the comment on success', async () => {
    mocks.deleteCommentAsync.mockResolvedValue({ success: true });
    const store = makeStore({ ...baseState, items: [{ id: 1 }, { id: 2 }], taskId: 5 });
    await store.dispatch(deleteComment({ taskId: 5, commentId: 1 }));
    expect(store.getState().comments.items).toEqual([{ id: 2 }]);
  });
});
