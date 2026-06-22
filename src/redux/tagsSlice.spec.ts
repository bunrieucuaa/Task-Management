import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

const mocks = vi.hoisted(() => ({
  listTagsAsync: vi.fn(),
  createTagAsync: vi.fn(),
  deleteTagAsync: vi.fn(),
}));

vi.mock('@/app/repositories/TagRepository', () => ({
  TagRepository: vi.fn(() => mocks),
}));

import reducer, { fetchTags, createTag, deleteTag } from './tagsSlice';

const makeStore = (preloaded?: Record<string, unknown>) =>
  configureStore({
    reducer: { tags: reducer },
    preloadedState: preloaded ? ({ tags: preloaded } as never) : undefined,
  });

const baseState = { items: [] as unknown[], loading: false, submitting: false };

beforeEach(() => vi.clearAllMocks());

describe('fetchTags thunk', () => {
  it('stores the tag catalog on success', async () => {
    mocks.listTagsAsync.mockResolvedValue({
      success: true,
      data: { tags: [{ id: 1, name: 'a' }, { id: 2, name: 'b' }] },
    });
    const store = makeStore();
    await store.dispatch(fetchTags());
    expect(store.getState().tags.items).toHaveLength(2);
    expect(store.getState().tags.loading).toBe(false);
  });

  it('sets loading during the pending phase', () => {
    mocks.listTagsAsync.mockReturnValue(new Promise(() => {}));
    const store = makeStore();
    store.dispatch(fetchTags());
    expect(store.getState().tags.loading).toBe(true);
  });
});

describe('createTag thunk', () => {
  it('appends the created tag', async () => {
    mocks.createTagAsync.mockResolvedValue({
      success: true,
      data: { tag: { id: 3, name: 'c' } },
    });
    const store = makeStore({ ...baseState, items: [{ id: 1, name: 'a' }] });
    await store.dispatch(createTag('c'));
    expect(store.getState().tags.items).toHaveLength(2);
    expect(store.getState().tags.items.at(-1)).toMatchObject({ id: 3, name: 'c' });
  });
});

describe('deleteTag thunk', () => {
  it('removes the tag on success', async () => {
    mocks.deleteTagAsync.mockResolvedValue({ success: true });
    const store = makeStore({ ...baseState, items: [{ id: 1, name: 'a' }, { id: 2, name: 'b' }] });
    await store.dispatch(deleteTag(1));
    expect(store.getState().tags.items).toEqual([{ id: 2, name: 'b' }]);
  });
});
