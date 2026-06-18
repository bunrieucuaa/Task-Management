import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

const mocks = vi.hoisted(() => ({
  listTasksAsync: vi.fn(),
  createTaskAsync: vi.fn(),
  updateTaskAsync: vi.fn(),
  deleteTaskAsync: vi.fn(),
}));

vi.mock('@/app/repositories/TaskRepository', () => ({
  TaskRepository: vi.fn(() => mocks),
}));

import reducer, {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  initialFilters,
} from './tasksSlice';

const makeStore = (items: unknown[] = []) =>
  configureStore({
    reducer: { tasks: reducer },
    preloadedState: {
      tasks: {
        items,
        pagination: { page: 1, limit: 10, total: items.length, totalPages: 1 },
        loading: false,
        submitting: false,
      },
    } as never,
  });

beforeEach(() => vi.clearAllMocks());

describe('fetchTasks thunk', () => {
  it('strips empty-string filters before calling the repository', async () => {
    mocks.listTasksAsync.mockResolvedValue({
      success: true,
      data: { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } },
    });
    const store = makeStore();
    await store.dispatch(fetchTasks({ ...initialFilters, status: 'TODO' }));

    const sentQuery = mocks.listTasksAsync.mock.calls[0][0];
    // empty-string filters removed
    expect(sentQuery).not.toHaveProperty('projectId');
    expect(sentQuery).not.toHaveProperty('search');
    // non-empty ones kept
    expect(sentQuery).toMatchObject({ status: 'TODO', page: 1, limit: 10 });
  });

  it('stores returned items', async () => {
    mocks.listTasksAsync.mockResolvedValue({
      success: true,
      data: { data: [{ id: 1, title: 'T' }], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } },
    });
    const store = makeStore();
    await store.dispatch(fetchTasks(initialFilters));
    expect(store.getState().tasks.items).toHaveLength(1);
  });
});

describe('createTask thunk', () => {
  it('prepends the created task', async () => {
    mocks.createTaskAsync.mockResolvedValue({ success: true, data: { task: { id: 5, title: 'New' } } });
    const store = makeStore([{ id: 1, title: 'Old' }]);
    await store.dispatch(createTask({ title: 'New', projectId: '1' } as never));
    expect(store.getState().tasks.items[0]).toMatchObject({ id: 5 });
    expect(store.getState().tasks.items).toHaveLength(2);
  });
});

describe('updateTask thunk', () => {
  it('replaces the matching task', async () => {
    mocks.updateTaskAsync.mockResolvedValue({
      success: true,
      data: { task: { id: 1, title: 'Updated' } },
    });
    const store = makeStore([{ id: 1, title: 'Old' }]);
    await store.dispatch(updateTask({ id: '1', data: { title: 'Updated' } } as never));
    expect(store.getState().tasks.items[0]).toMatchObject({ title: 'Updated' });
  });
});

describe('deleteTask thunk', () => {
  it('removes the task on success', async () => {
    mocks.deleteTaskAsync.mockResolvedValue({ success: true });
    const store = makeStore([{ id: 1 }, { id: 2 }]);
    await store.dispatch(deleteTask('2'));
    expect(store.getState().tasks.items).toEqual([{ id: 1 }]);
  });
});
