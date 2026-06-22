import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithStore, makeTestStore } from '@/test/render';
import Tasks from './Tasks';
import { ERole } from '@/app/shared/enums/ERole';
import { EUserStatus } from '@/app/shared/enums/EUserStatus';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Mount dispatches fetchTasks (TaskRepository) + fetchProjects (ProjectRepository);
// opening the comments dialog hits CommentRepository. Keep all three inert by default.
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
const commentRepo = vi.hoisted(() => ({
  listCommentsAsync: vi.fn(),
  createCommentAsync: vi.fn(),
  deleteCommentAsync: vi.fn(),
}));
vi.mock('@/app/repositories/TaskRepository', () => ({ TaskRepository: vi.fn(() => taskRepo) }));
vi.mock('@/app/repositories/ProjectRepository', () => ({
  ProjectRepository: vi.fn(() => projectRepo),
}));
vi.mock('@/app/repositories/CommentRepository', () => ({
  CommentRepository: vi.fn(() => commentRepo),
}));

// Radix DropdownMenu needs pointer-capture APIs jsdom doesn't implement.
beforeAll(() => {
  window.HTMLElement.prototype.hasPointerCapture = vi.fn();
  window.HTMLElement.prototype.setPointerCapture = vi.fn();
  window.HTMLElement.prototype.releasePointerCapture = vi.fn();
});

const emptyTasks = {
  success: true,
  data: { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
};

const authState = (role: ERole, id = 1) => ({
  loading: false,
  token: 'tok',
  isAuthenticated: true,
  mustChangePassword: false,
  user: {
    id,
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

const tasksState = () => ({
  items: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  loading: false,
  submitting: false,
});

const projectsState = () => ({
  items: [],
  selectedProject: null,
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  loading: false,
  submitting: false,
  members: [],
  membersLoading: false,
  directory: [],
  directoryLoading: false,
});

// Task created by user 2 / assigned to user 3 → a plain member (id 1) cannot edit/delete it.
const taskRow = {
  id: 5,
  title: 'Demo task',
  description: 'A description',
  projectId: 9,
  creatorId: 2,
  assigneeId: 3,
  status: 'TODO',
  priority: 'MEDIUM',
  deadline: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  project: { id: 9, name: 'Apollo' },
  assignee: { id: 3, name: 'Carol', avatarUrl: null },
};

const renderPage = (role: ERole = ERole.Member, id = 1) =>
  renderWithStore(
    <Tasks />,
    makeTestStore({ auth: authState(role, id), tasks: tasksState(), projects: projectsState() }),
  );

beforeEach(() => {
  vi.clearAllMocks();
  taskRepo.listTasksAsync.mockResolvedValue(emptyTasks);
  projectRepo.listProjectsAsync.mockResolvedValue({
    success: true,
    data: { data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } },
  });
  projectRepo.listMembersAsync.mockResolvedValue({ success: true, data: { members: [] } });
  commentRepo.listCommentsAsync.mockResolvedValue({ success: true, data: { data: [] } });
});

describe('<Tasks />', () => {
  it('loads tasks and project options on mount', () => {
    renderPage();
    expect(taskRepo.listTasksAsync).toHaveBeenCalledTimes(1);
    expect(projectRepo.listProjectsAsync).toHaveBeenCalledTimes(1);
  });

  it('renders task rows returned by the repository', async () => {
    taskRepo.listTasksAsync.mockResolvedValue({
      success: true,
      data: { data: [taskRow], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } },
    });
    renderPage();
    expect(await screen.findByText('Demo task')).toBeInTheDocument();
    expect(screen.getByText('Apollo')).toBeInTheDocument(); // project name
    expect(screen.getByText('Carol')).toBeInTheDocument(); // assignee name
  });

  it('shows the empty-state message when there are no tasks', async () => {
    renderPage();
    expect(await screen.findByText('Chưa có task nào.')).toBeInTheDocument();
  });

  it('refetches with page 1 when searching', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Chưa có task nào.');
    taskRepo.listTasksAsync.mockClear();
    await user.type(screen.getByPlaceholderText('Tìm theo tiêu đề / mô tả'), 'demo');
    await user.click(screen.getByRole('button', { name: /Tìm kiếm/ }));
    expect(taskRepo.listTasksAsync).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'demo', page: 1 }),
    );
  });

  it('opens the create dialog from the toolbar', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Chưa có task nào.');
    await user.click(screen.getByRole('button', { name: /Tạo task/ }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Tạo task mới' })).toBeInTheDocument();
  });

  it('opens the comments dialog and loads comments from the row menu', async () => {
    const user = userEvent.setup();
    taskRepo.listTasksAsync.mockResolvedValue({
      success: true,
      data: { data: [taskRow], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } },
    });
    renderPage();
    await screen.findByText('Demo task');
    await user.click(screen.getByRole('button', { name: 'Task actions' }));
    await user.click(await screen.findByRole('menuitem', { name: /Bình luận/ }));
    expect(commentRepo.listCommentsAsync).toHaveBeenCalledWith(5);
    expect(await screen.findByRole('heading', { name: 'Bình luận' })).toBeInTheDocument();
  });

  it('disables edit/delete in the row menu for a member who is neither creator nor assignee', async () => {
    const user = userEvent.setup();
    taskRepo.listTasksAsync.mockResolvedValue({
      success: true,
      data: { data: [taskRow], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } },
    });
    renderPage(ERole.Member, 1);
    await screen.findByText('Demo task');
    await user.click(screen.getByRole('button', { name: 'Task actions' }));
    expect(await screen.findByRole('menuitem', { name: 'Chỉnh sửa' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('menuitem', { name: /Xoá/ })).toHaveAttribute('aria-disabled', 'true');
    // Commenting stays open to anyone who can read the task.
    expect(screen.getByRole('menuitem', { name: /Bình luận/ })).not.toHaveAttribute('aria-disabled');
  });

  it('switches to the Kanban board view and lays tasks out in status columns', async () => {
    const user = userEvent.setup();
    taskRepo.listTasksAsync.mockResolvedValue({
      success: true,
      data: { data: [taskRow], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } },
    });
    renderPage(ERole.Admin, 1);
    await screen.findByText('Demo task');
    await user.click(screen.getByRole('button', { name: /Kanban/ }));
    const todoColumn = screen.getByTestId('column-TODO');
    expect(within(todoColumn).getByTestId('task-card-5')).toBeInTheDocument();
    // The table header is gone once the board takes over.
    expect(screen.queryByRole('columnheader', { name: 'Tiêu đề' })).not.toBeInTheDocument();
  });

  it('enables edit/delete in the row menu for an admin', async () => {
    const user = userEvent.setup();
    taskRepo.listTasksAsync.mockResolvedValue({
      success: true,
      data: { data: [taskRow], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } },
    });
    renderPage(ERole.Admin, 1);
    await screen.findByText('Demo task');
    await user.click(screen.getByRole('button', { name: 'Task actions' }));
    expect(await screen.findByRole('menuitem', { name: 'Chỉnh sửa' })).not.toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });
});
