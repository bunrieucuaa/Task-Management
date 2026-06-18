import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME } from '@/app/core/constants';

const mocks = vi.hoisted(() => ({
  postLoginTokenAsync: vi.fn(),
  getMeAsync: vi.fn(),
  logoutAsync: vi.fn(),
  changePasswordAsync: vi.fn(),
}));

vi.mock('@/app/repositories/AuthRepository', () => ({
  AuthRepository: vi.fn(() => mocks),
}));

// Decode any token to a valid, non-expired ADMIN payload.
vi.mock('jwt-decode', () => ({
  jwtDecode: () => ({ role: 'ADMIN', exp: Math.floor(Date.now() / 1000) + 3600 }),
}));

import reducer, {
  updateIsAuthenticated,
  setMustChangePassword,
  setCurrentUser,
  clearAuth,
  hasStoredAuthTokens,
  postLogins,
  getMe,
  logoutUser,
  changePassword,
} from './authSlice';

const makeStore = () => configureStore({ reducer: { auth: reducer } });

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('authSlice reducers', () => {
  it('updateIsAuthenticated sets the flag and marks initialized', () => {
    const state = reducer(undefined, updateIsAuthenticated(true));
    expect(state.isAuthenticated).toBe(true);
    expect(state.initialized).toBe(true);
  });

  it('setMustChangePassword + setCurrentUser update their slices', () => {
    let state = reducer(undefined, setMustChangePassword(true));
    expect(state.mustChangePassword).toBe(true);
    state = reducer(state, setCurrentUser({ id: 1, name: 'A' } as never));
    expect(state.user).toMatchObject({ id: 1 });
  });

  it('clearAuth resets to a logged-out state', () => {
    const dirty = reducer(undefined, setCurrentUser({ id: 1 } as never));
    const state = reducer(dirty, clearAuth());
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.initialized).toBe(true);
  });
});

describe('hasStoredAuthTokens', () => {
  it('is false with empty storage, true once a token is stored', () => {
    expect(hasStoredAuthTokens()).toBe(false);
    localStorage.setItem(ACCESS_TOKEN_NAME, 'x');
    expect(hasStoredAuthTokens()).toBe(true);
  });
});

describe('postLogins thunk', () => {
  it('stores tokens and flags authenticated on a valid login', async () => {
    mocks.postLoginTokenAsync.mockResolvedValue({
      success: true,
      data: {
        accessToken: 'access.jwt',
        refreshToken: 'refresh.jwt',
        user: { id: 1, name: 'A', role: 'ADMIN' },
        mustChangePassword: false,
      },
    });

    const store = makeStore();
    const result = await store.dispatch(postLogins({ email: 'a@b.com', password: 'x' }));

    expect((result.payload as { isValid: boolean }).isValid).toBe(true);
    expect(localStorage.getItem(ACCESS_TOKEN_NAME)).toBe('access.jwt');
    expect(localStorage.getItem(REFRESH_TOKEN_NAME)).toBe('refresh.jwt');
    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(store.getState().auth.user).toMatchObject({ id: 1 });
  });

  it('does not authenticate when the API reports failure', async () => {
    mocks.postLoginTokenAsync.mockResolvedValue({ success: false, data: null });
    const store = makeStore();
    const result = await store.dispatch(postLogins({ email: 'a@b.com', password: 'x' }));
    expect((result.payload as { isValid: boolean }).isValid).toBe(false);
    expect(localStorage.getItem(ACCESS_TOKEN_NAME)).toBeNull();
  });
});

describe('getMe thunk', () => {
  it('populates user on success', async () => {
    mocks.getMeAsync.mockResolvedValue({ success: true, data: { user: { id: 9, name: 'Z' } } });
    const store = makeStore();
    await store.dispatch(getMe());
    expect(store.getState().auth.user).toMatchObject({ id: 9 });
  });

  it('leaves user null on failure', async () => {
    mocks.getMeAsync.mockResolvedValue({ success: false, data: null });
    const store = makeStore();
    await store.dispatch(getMe());
    expect(store.getState().auth.user).toBeNull();
  });
});

describe('logoutUser / changePassword thunks', () => {
  it('logoutUser clears tokens and auth state', async () => {
    localStorage.setItem(ACCESS_TOKEN_NAME, 'a');
    localStorage.setItem(REFRESH_TOKEN_NAME, 'r');
    mocks.logoutAsync.mockResolvedValue({ success: true });

    const store = makeStore();
    await store.dispatch(logoutUser());

    expect(localStorage.getItem(ACCESS_TOKEN_NAME)).toBeNull();
    expect(store.getState().auth.user).toBeNull();
  });

  it('changePassword clears tokens and resets mustChangePassword on success', async () => {
    localStorage.setItem(ACCESS_TOKEN_NAME, 'a');
    mocks.changePasswordAsync.mockResolvedValue({ success: true });

    const store = makeStore();
    await store.dispatch(changePassword({ oldPassword: 'x', newPassword: 'y' }));

    expect(localStorage.getItem(ACCESS_TOKEN_NAME)).toBeNull();
    expect(store.getState().auth.mustChangePassword).toBe(false);
  });
});
