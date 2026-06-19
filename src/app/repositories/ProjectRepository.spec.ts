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

import { ProjectRepository } from './ProjectRepository';

const BASE = 'http://localhost:8080/api/v1';

beforeEach(() => {
  vi.clearAllMocks();
  axiosMock.get.mockResolvedValue({ data: { success: true, data: {} } });
  axiosMock.post.mockResolvedValue({ data: { success: true, data: {} } });
  axiosMock.patch.mockResolvedValue({ data: { success: true, data: {} } });
  axiosMock.delete.mockResolvedValue({ data: { success: true } });
});

describe('ProjectRepository', () => {
  const repo = () => new ProjectRepository();

  it('listProjectsAsync GETs /projects with the query as params', async () => {
    await repo().listProjectsAsync({ page: 2, limit: 10 } as never);
    expect(axiosMock.get).toHaveBeenCalledWith(`${BASE}/projects`, { params: { page: 2, limit: 10 } });
  });

  it('getProjectByIdAsync GETs /projects/:id', async () => {
    await repo().getProjectByIdAsync('7');
    expect(axiosMock.get).toHaveBeenCalledWith(`${BASE}/projects/7`, { params: {} });
  });

  it('createProjectAsync POSTs to /projects', async () => {
    await repo().createProjectAsync({ name: 'P' } as never);
    expect(axiosMock.post).toHaveBeenCalledWith(`${BASE}/projects`, { name: 'P' });
  });

  it('updateProjectAsync PATCHes /projects/:id', async () => {
    await repo().updateProjectAsync('7', { name: 'New' } as never);
    expect(axiosMock.patch).toHaveBeenCalledWith(`${BASE}/projects/7`, { name: 'New' });
  });

  it('deleteProjectAsync DELETEs /projects/:id', async () => {
    await repo().deleteProjectAsync('7');
    expect(axiosMock.delete).toHaveBeenCalledWith(`${BASE}/projects/7`);
  });

  it('listMembersAsync GETs /projects/:id/members', async () => {
    await repo().listMembersAsync('7');
    expect(axiosMock.get).toHaveBeenCalledWith(`${BASE}/projects/7/members`, { params: {} });
  });

  it('addMemberAsync POSTs to /projects/:id/members', async () => {
    await repo().addMemberAsync('7', { email: 'bob@e.com' } as never);
    expect(axiosMock.post).toHaveBeenCalledWith(`${BASE}/projects/7/members`, { email: 'bob@e.com' });
  });

  it('removeMemberAsync DELETEs /projects/:id/members/:userId', async () => {
    await repo().removeMemberAsync('7', '3');
    expect(axiosMock.delete).toHaveBeenCalledWith(`${BASE}/projects/7/members/3`);
  });

  it('returns the response body', async () => {
    const body = { success: true, data: { project: { id: 7 } } };
    axiosMock.get.mockResolvedValue({ data: body });
    await expect(repo().getProjectByIdAsync('7')).resolves.toEqual(body);
  });
});
