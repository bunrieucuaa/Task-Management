import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

const mocks = vi.hoisted(() => ({
  listUsersAsync: vi.fn(),
  createUserAsync: vi.fn(),
  getUserByIdAsync: vi.fn(),
  updateProfileAsync: vi.fn(),
  updateUserStatusAsync: vi.fn(),
  resetUserPasswordAsync: vi.fn(),
  deleteUserAsync: vi.fn(),
}));

vi.mock('@/app/repositories/UserRepository', () => ({
  UserRepository: vi.fn(() => mocks),
}));

import reducer, {
  updateUserFilters,
  resetUserFilters,
  clearTemporaryPasswordResult,
  fetchUsers,
  createUser,
  updateUserStatus,
  deleteUser,
  initialFilters,
} from './usersSlice';

const makeStore = () => configureStore({ reducer: { users: reducer } });

beforeEach(() => vi.clearAllMocks());

describe('usersSlice reducers', () => {
  it('updateUserFilters merges into existing filters', () => {
    const state = reducer(undefined, updateUserFilters({ search: 'ali', page: 3 }));
    expect(state.filters).toMatchObject({ search: 'ali', page: 3 });
  });

  it('resetUserFilters restores defaults', () => {
    let state = reducer(undefined, updateUserFilters({ search: 'x' }));
    state = reducer(state, resetUserFilters());
    expect(state.filters).toEqual(initialFilters);
  });

  it('clearTemporaryPasswordResult nulls the result', () => {
    const state = reducer(
      { temporaryPasswordResult: { user: { id: 1 } } } as never,
      clearTemporaryPasswordResult(),
    );
    expect(state.temporaryPasswordResult).toBeNull();
  });
});

describe('fetchUsers thunk', () => {
  it('stores items + pagination on success', async () => {
    mocks.listUsersAsync.mockResolvedValue({
      success: true,
      data: {
        data: [{ id: 1, name: 'A' }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      },
    });
    const store = makeStore();
    await store.dispatch(fetchUsers(initialFilters));
    expect(store.getState().users.items).toHaveLength(1);
    expect(store.getState().users.pagination.total).toBe(1);
    expect(store.getState().users.loading).toBe(false);
  });

  it('falls back to an empty list on failure', async () => {
    mocks.listUsersAsync.mockResolvedValue({ success: false, data: null });
    const store = makeStore();
    await store.dispatch(fetchUsers(initialFilters));
    expect(store.getState().users.items).toEqual([]);
  });
});

describe('createUser thunk', () => {
  it('prepends the new user and stores the temporary-password result', async () => {
    const payload = { user: { id: 2, name: 'New' }, temporaryPassword: 'Temp123!' };
    mocks.createUserAsync.mockResolvedValue({ success: true, data: payload });
    const store = makeStore();
    await store.dispatch(createUser({ name: 'New', email: 'n@e.com' } as never));
    expect(store.getState().users.items[0]).toMatchObject({ id: 2 });
    expect(store.getState().users.temporaryPasswordResult).toMatchObject({ temporaryPassword: 'Temp123!' });
  });
});

describe('updateUserStatus thunk', () => {
  it('replaces the user in the list', async () => {
    mocks.updateUserStatusAsync.mockResolvedValue({
      success: true,
      data: { user: { id: 1, name: 'A', status: 'BLOCKED' } },
    });
    const preloaded = configureStore({
      reducer: { users: reducer },
      preloadedState: {
        users: {
          items: [{ id: 1, name: 'A', status: 'ACTIVE' }],
          selectedUser: null,
          filters: initialFilters,
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          loading: false,
          submitting: false,
          temporaryPasswordResult: null,
        },
      } as never,
    });
    await preloaded.dispatch(updateUserStatus({ id: '1', data: { status: 'BLOCKED' } } as never));
    expect(preloaded.getState().users.items[0]).toMatchObject({ status: 'BLOCKED' });
  });
});

describe('deleteUser thunk', () => {
  it('removes the user from the list on success', async () => {
    mocks.deleteUserAsync.mockResolvedValue({ success: true });
    const store = configureStore({
      reducer: { users: reducer },
      preloadedState: {
        users: {
          items: [{ id: 1 }, { id: 2 }],
          selectedUser: null,
          filters: initialFilters,
          pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
          loading: false,
          submitting: false,
          temporaryPasswordResult: null,
        },
      } as never,
    });
    await store.dispatch(deleteUser('1'));
    expect(store.getState().users.items).toEqual([{ id: 2 }]);
  });
});
