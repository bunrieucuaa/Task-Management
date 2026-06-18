import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

const projectMocks = vi.hoisted(() => ({
  listProjectsAsync: vi.fn(),
  getProjectByIdAsync: vi.fn(),
  createProjectAsync: vi.fn(),
  updateProjectAsync: vi.fn(),
  deleteProjectAsync: vi.fn(),
  listMembersAsync: vi.fn(),
  addMemberAsync: vi.fn(),
  removeMemberAsync: vi.fn(),
}));

const userMocks = vi.hoisted(() => ({
  getDirectoryAsync: vi.fn(),
}));

vi.mock('@/app/repositories/ProjectRepository', () => ({
  ProjectRepository: vi.fn(() => projectMocks),
}));

vi.mock('@/app/repositories/UserRepository', () => ({
  UserRepository: vi.fn(() => userMocks),
}));

import reducer, {
  clearSelectedProject,
  fetchProjects,
  fetchProjectById,
  createProject,
  updateProject,
  deleteProject,
  fetchMembers,
  addMember,
  removeMember,
  fetchDirectory,
  initialFilters,
  initialPagination,
} from './projectsSlice';

const makeStore = (preloaded?: Record<string, unknown>) =>
  configureStore({
    reducer: { projects: reducer },
    preloadedState: preloaded ? ({ projects: preloaded } as never) : undefined,
  });

const baseState = {
  items: [] as unknown[],
  selectedProject: null,
  pagination: initialPagination,
  loading: false,
  submitting: false,
  members: [] as unknown[],
  membersLoading: false,
  directory: [] as unknown[],
  directoryLoading: false,
};

beforeEach(() => vi.clearAllMocks());

describe('projectsSlice reducers', () => {
  it('clearSelectedProject resets selection and members', () => {
    const state = reducer(
      { ...baseState, selectedProject: { id: 1 }, members: [{ userId: 9 }] } as never,
      clearSelectedProject(),
    );
    expect(state.selectedProject).toBeNull();
    expect(state.members).toEqual([]);
  });
});

describe('fetchProjects thunk', () => {
  it('stores items + pagination on success', async () => {
    projectMocks.listProjectsAsync.mockResolvedValue({
      success: true,
      data: {
        data: [{ id: 1, name: 'P1' }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      },
    });
    const store = makeStore();
    await store.dispatch(fetchProjects(initialFilters));
    expect(store.getState().projects.items).toHaveLength(1);
    expect(store.getState().projects.pagination.total).toBe(1);
    expect(store.getState().projects.loading).toBe(false);
  });

  it('falls back to an empty list on failure', async () => {
    projectMocks.listProjectsAsync.mockResolvedValue({ success: false, data: null });
    const store = makeStore();
    await store.dispatch(fetchProjects(initialFilters));
    expect(store.getState().projects.items).toEqual([]);
  });
});

describe('fetchProjectById thunk', () => {
  it('sets the selected project on success', async () => {
    projectMocks.getProjectByIdAsync.mockResolvedValue({
      success: true,
      data: { project: { id: 7, name: 'Sel' } },
    });
    const store = makeStore();
    await store.dispatch(fetchProjectById('7'));
    expect(store.getState().projects.selectedProject).toMatchObject({ id: 7 });
  });
});

describe('createProject thunk', () => {
  it('prepends the created project', async () => {
    projectMocks.createProjectAsync.mockResolvedValue({
      success: true,
      data: { project: { id: 5, name: 'New' } },
    });
    const store = makeStore({ ...baseState, items: [{ id: 1, name: 'Old' }] });
    await store.dispatch(createProject({ name: 'New' } as never));
    expect(store.getState().projects.items[0]).toMatchObject({ id: 5 });
    expect(store.getState().projects.items).toHaveLength(2);
    expect(store.getState().projects.submitting).toBe(false);
  });
});

describe('updateProject thunk', () => {
  it('replaces the matching project and updates selection', async () => {
    projectMocks.updateProjectAsync.mockResolvedValue({
      success: true,
      data: { project: { id: 1, name: 'Updated' } },
    });
    const store = makeStore({
      ...baseState,
      items: [{ id: 1, name: 'Old' }],
      selectedProject: { id: 1, name: 'Old' },
    });
    await store.dispatch(updateProject({ id: '1', data: { name: 'Updated' } } as never));
    expect(store.getState().projects.items[0]).toMatchObject({ name: 'Updated' });
    expect(store.getState().projects.selectedProject).toMatchObject({ name: 'Updated' });
  });
});

describe('deleteProject thunk', () => {
  it('removes the project on success', async () => {
    projectMocks.deleteProjectAsync.mockResolvedValue({ success: true });
    const store = makeStore({ ...baseState, items: [{ id: 1 }, { id: 2 }] });
    await store.dispatch(deleteProject('1'));
    expect(store.getState().projects.items).toEqual([{ id: 2 }]);
  });
});

describe('member thunks', () => {
  it('fetchMembers stores members', async () => {
    projectMocks.listMembersAsync.mockResolvedValue({
      success: true,
      data: { members: [{ userId: 3 }, { userId: 4 }] },
    });
    const store = makeStore();
    await store.dispatch(fetchMembers('1'));
    expect(store.getState().projects.members).toHaveLength(2);
    expect(store.getState().projects.membersLoading).toBe(false);
  });

  it('addMember appends a member', async () => {
    projectMocks.addMemberAsync.mockResolvedValue({
      success: true,
      data: { member: { userId: 9 } },
    });
    const store = makeStore({ ...baseState, members: [{ userId: 3 }] });
    await store.dispatch(addMember({ id: '1', data: { userId: '9' } } as never));
    expect(store.getState().projects.members).toHaveLength(2);
    expect(store.getState().projects.members.at(-1)).toMatchObject({ userId: 9 });
  });

  it('removeMember drops the member by numeric userId', async () => {
    projectMocks.removeMemberAsync.mockResolvedValue({ success: true });
    const store = makeStore({ ...baseState, members: [{ userId: 3 }, { userId: 9 }] });
    await store.dispatch(removeMember({ id: '1', userId: '9' }));
    expect(store.getState().projects.members).toEqual([{ userId: 3 }]);
  });
});

describe('fetchDirectory thunk', () => {
  it('stores the active-user directory', async () => {
    userMocks.getDirectoryAsync.mockResolvedValue({
      success: true,
      data: { users: [{ id: 1 }, { id: 2 }] },
    });
    const store = makeStore();
    await store.dispatch(fetchDirectory());
    expect(store.getState().projects.directory).toHaveLength(2);
    expect(store.getState().projects.directoryLoading).toBe(false);
  });
});
