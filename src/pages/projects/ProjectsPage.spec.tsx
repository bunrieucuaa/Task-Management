import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithStore, makeTestStore } from '@/test/render';
import ProjectsPage from './ProjectsPage';
import { initialPagination } from '@/redux/projectsSlice';
import { ERole } from '@/app/shared/enums/ERole';
import { EProjectStatus } from '@/app/shared/enums/EProjectStatus';
import { EUserStatus } from '@/app/shared/enums/EUserStatus';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// fetchProjects (mount) + fetchMembers go through ProjectRepository; fetchDirectory
// (managers only) goes through UserRepository. Keep both inert by default.
const emptyProjects = {
  success: true,
  data: { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
};
const projectRepo = vi.hoisted(() => ({
  listProjectsAsync: vi.fn(),
  getProjectByIdAsync: vi.fn(),
  createProjectAsync: vi.fn(),
  updateProjectAsync: vi.fn(),
  deleteProjectAsync: vi.fn(),
  listMembersAsync: vi.fn(),
  addMemberAsync: vi.fn(),
  removeMemberAsync: vi.fn(),
}));
const userRepo = vi.hoisted(() => ({ getDirectoryAsync: vi.fn() }));
vi.mock('@/app/repositories/ProjectRepository', () => ({
  ProjectRepository: vi.fn(() => projectRepo),
}));
vi.mock('@/app/repositories/UserRepository', () => ({
  UserRepository: vi.fn(() => userRepo),
}));

// Radix DropdownMenu relies on pointer-capture APIs jsdom doesn't implement.
beforeAll(() => {
  window.HTMLElement.prototype.hasPointerCapture = vi.fn();
  window.HTMLElement.prototype.setPointerCapture = vi.fn();
  window.HTMLElement.prototype.releasePointerCapture = vi.fn();
});

const authState = (role: ERole) => ({
  loading: false,
  token: 'tok',
  isAuthenticated: true,
  mustChangePassword: false,
  user: {
    id: 1,
    name: 'Me',
    email: 'me@example.com',
    role,
    status: EUserStatus.Active,
    avatarUrl: null,
    mustChangePassword: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  initialized: true,
  initializing: false,
  userLoading: false,
});

const projectsState = () => ({
  items: [],
  selectedProject: null,
  pagination: initialPagination,
  loading: false,
  submitting: false,
  members: [],
  membersLoading: false,
  directory: [],
  directoryLoading: false,
});

const projectRow = {
  id: 7,
  name: 'Apollo',
  description: null,
  ownerId: 2,
  status: EProjectStatus.Active,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  owner: { id: 2, name: 'Alice', email: 'alice@example.com', avatarUrl: null },
  _count: { members: 3, tasks: 5 },
};

const renderPage = (role: ERole = ERole.Admin) =>
  renderWithStore(<ProjectsPage />, makeTestStore({ auth: authState(role), projects: projectsState() }));

beforeEach(() => {
  vi.clearAllMocks();
  projectRepo.listProjectsAsync.mockResolvedValue(emptyProjects);
  projectRepo.listMembersAsync.mockResolvedValue({ success: true, data: { members: [] } });
  userRepo.getDirectoryAsync.mockResolvedValue({ success: true, data: { users: [] } });
});

describe('<ProjectsPage />', () => {
  it('fetches projects on mount and the directory for a manager', () => {
    renderPage(ERole.PM);
    expect(projectRepo.listProjectsAsync).toHaveBeenCalledTimes(1);
    expect(userRepo.getDirectoryAsync).toHaveBeenCalledTimes(1);
  });

  it('does not load the directory for a plain member', () => {
    renderPage(ERole.Member);
    expect(projectRepo.listProjectsAsync).toHaveBeenCalledTimes(1);
    expect(userRepo.getDirectoryAsync).not.toHaveBeenCalled();
  });

  it('shows the create button only for managers', () => {
    const { unmount } = renderPage(ERole.Admin);
    expect(screen.getByRole('button', { name: /Tạo project/ })).toBeInTheDocument();
    unmount();
    renderPage(ERole.Member);
    expect(screen.queryByRole('button', { name: /Tạo project/ })).not.toBeInTheDocument();
  });

  it('renders project rows returned by the repository', async () => {
    projectRepo.listProjectsAsync.mockResolvedValue({
      success: true,
      data: { data: [projectRow], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } },
    });
    renderPage(ERole.Admin);
    expect(await screen.findByText('Apollo')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument(); // owner name
    expect(screen.getByText('3')).toBeInTheDocument(); // member count
  });

  it('shows the empty-state message when there are no projects', async () => {
    renderPage(ERole.Admin);
    expect(await screen.findByText('Chưa có project nào.')).toBeInTheDocument();
  });

  it('refetches with page 1 when searching', async () => {
    const user = userEvent.setup();
    renderPage(ERole.Admin);
    await screen.findByText('Chưa có project nào.');
    projectRepo.listProjectsAsync.mockClear();
    await user.type(screen.getByPlaceholderText('Tìm theo tên hoặc mô tả'), 'apo');
    await user.click(screen.getByRole('button', { name: /Tìm kiếm/ }));
    expect(projectRepo.listProjectsAsync).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'apo', page: 1 }),
    );
  });

  it('opens the create dialog for a manager', async () => {
    const user = userEvent.setup();
    renderPage(ERole.Admin);
    await screen.findByText('Chưa có project nào.');
    await user.click(screen.getByRole('button', { name: /Tạo project/ }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Tạo project mới' })).toBeInTheDocument();
  });

  it('opens the members dialog and loads members from the row menu', async () => {
    const user = userEvent.setup();
    projectRepo.listProjectsAsync.mockResolvedValue({
      success: true,
      data: { data: [projectRow], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } },
    });
    renderPage(ERole.Admin);
    await screen.findByText('Apollo');
    await user.click(screen.getByRole('button', { name: 'Project actions' }));
    await user.click(await screen.findByText('Thành viên'));
    expect(projectRepo.listMembersAsync).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('heading', { name: /Thành viên — Apollo/ })).toBeInTheDocument();
  });
});
