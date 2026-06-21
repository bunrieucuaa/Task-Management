import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithStore, makeTestStore } from '@/test/render';
import HomePage from './HomePage';
import { ERole } from '@/app/shared/enums/ERole';
import { EUserStatus } from '@/app/shared/enums/EUserStatus';

// Router Link is rendered as a plain anchor so we can assert hrefs without a router.
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

// Mount dispatches fetchProjects (ProjectRepository) + fetchTasks (TaskRepository).
const taskRepo = vi.hoisted(() => ({
  listTasksAsync: vi.fn(),
  createTaskAsync: vi.fn(),
  updateTaskAsync: vi.fn(),
  deleteTaskAsync: vi.fn(),
}));
const projectRepo = vi.hoisted(() => ({
  listProjectsAsync: vi.fn(),
  listMembersAsync: vi.fn(),
  getProjectByIdAsync: vi.fn(),
  createProjectAsync: vi.fn(),
  updateProjectAsync: vi.fn(),
  deleteProjectAsync: vi.fn(),
  addMemberAsync: vi.fn(),
  removeMemberAsync: vi.fn(),
}));
vi.mock('@/app/repositories/TaskRepository', () => ({ TaskRepository: vi.fn(() => taskRepo) }));
vi.mock('@/app/repositories/ProjectRepository', () => ({
  ProjectRepository: vi.fn(() => projectRepo),
}));

const authState = (role: ERole = ERole.Member, id = 1) => ({
  loading: false,
  token: 'tok',
  isAuthenticated: true,
  mustChangePassword: false,
  user: {
    id,
    name: 'Alice',
    email: 'alice@example.com',
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

const task = (over: Record<string, unknown> = {}) => ({
  id: 1,
  title: 'Task',
  description: null,
  projectId: 9,
  creatorId: 1,
  assigneeId: 1,
  status: 'TODO',
  priority: 'MEDIUM',
  deadline: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  creator: null,
  assignee: null,
  project: { id: 9, name: 'Apollo' },
  ...over,
});

// 2 TODO (one future deadline, one past), 1 IN_PROGRESS (future), 1 DONE (future).
const taskRows = [
  task({ id: 1, title: 'Future todo', status: 'TODO', deadline: '2099-01-10T00:00:00.000Z' }),
  task({ id: 2, title: 'Past todo', status: 'TODO', deadline: '2000-01-01T00:00:00.000Z' }),
  task({ id: 3, title: 'Future doing', status: 'IN_PROGRESS', deadline: '2099-01-05T00:00:00.000Z' }),
  task({ id: 4, title: 'Future done', status: 'DONE', deadline: '2099-01-02T00:00:00.000Z' }),
];

const renderPage = (role: ERole = ERole.Member) =>
  renderWithStore(<HomePage />, makeTestStore({ auth: authState(role) }));

beforeEach(() => {
  vi.clearAllMocks();
  projectRepo.listProjectsAsync.mockResolvedValue({
    success: true,
    data: { data: [], pagination: { page: 1, limit: 1, total: 3, totalPages: 3 } },
  });
  taskRepo.listTasksAsync.mockResolvedValue({
    success: true,
    data: { data: taskRows, pagination: { page: 1, limit: 100, total: 4, totalPages: 1 } },
  });
});

describe('<HomePage />', () => {
  it('loads projects and tasks on mount', () => {
    renderPage();
    expect(projectRepo.listProjectsAsync).toHaveBeenCalledTimes(1);
    expect(taskRepo.listTasksAsync).toHaveBeenCalledTimes(1);
  });

  it('greets the signed-in user by name', async () => {
    renderPage();
    expect(await screen.findByText(/Alice/)).toBeInTheDocument();
  });

  it('shows total project and task counts from pagination', async () => {
    renderPage();
    expect(within(await screen.findByRole('group', { name: 'Dự án' })).getByText('3')).toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: 'Tổng task' })).getByText('4')).toBeInTheDocument();
  });

  it('breaks tasks down by status from the fetched items', async () => {
    renderPage();
    expect(within(await screen.findByRole('group', { name: 'To Do' })).getByText('2')).toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: 'In Progress' })).getByText('1')).toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: 'Done' })).getByText('1')).toBeInTheDocument();
  });

  it('lists upcoming deadlines (open, future) sorted earliest first, excluding done/past', async () => {
    renderPage();
    const list = await screen.findByRole('list', { name: /sắp tới hạn/i });
    const items = within(list).getAllByRole('listitem');
    expect(items.map((i) => i.textContent)).toEqual([
      expect.stringContaining('Future doing'), // 2099-01-05, earlier
      expect.stringContaining('Future todo'), // 2099-01-10
    ]);
    expect(within(list).queryByText('Future done')).not.toBeInTheDocument();
    expect(within(list).queryByText('Past todo')).not.toBeInTheDocument();
  });

  it('renders quick navigation links to Projects and Tasks', async () => {
    renderPage();
    await screen.findByText(/Alice/);
    expect(screen.getByRole('link', { name: /Dự án/ })).toHaveAttribute('href', '/projects');
    expect(screen.getByRole('link', { name: /Tổng task/ })).toHaveAttribute('href', '/tasks');
  });
});
