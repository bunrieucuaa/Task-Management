import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithStore, makeTestStore } from '@/test/render';
import UsersPage from './UsersPage';
import { initialFilters } from '@/redux/usersSlice';
import { ERole } from '@/app/shared/enums/ERole';
import { EUserStatus } from '@/app/shared/enums/EUserStatus';

// Router: the page calls useNavigate and may redirect non-admins via <Navigate>.
const navigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  Navigate: ({ to }: { to: string }) => <div data-testid="redirect">redirect:{to}</div>,
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// The page always refetches on mount, so user rows are driven through the repository
// rather than preloaded store state (the mount fetch would overwrite the latter).
const emptyPage = {
  success: true,
  data: { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } },
};
const repoMocks = vi.hoisted(() => ({
  listUsersAsync: vi.fn(),
  createUserAsync: vi.fn(),
  updateUserStatusAsync: vi.fn(),
  resetUserPasswordAsync: vi.fn(),
  deleteUserAsync: vi.fn(),
}));
vi.mock('@/app/repositories/UserRepository', () => ({
  UserRepository: vi.fn(() => repoMocks),
}));

const adminUser = {
  id: 1,
  name: 'Admin',
  email: 'admin@example.com',
  role: ERole.Admin,
  status: EUserStatus.Active,
  avatarUrl: null,
  mustChangePassword: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const authState = (role: ERole) => ({
  loading: false,
  token: 'tok',
  isAuthenticated: true,
  mustChangePassword: false,
  user: { ...adminUser, role },
  initialized: true,
  initializing: false,
  userLoading: false,
});

const usersState = () => ({
  items: [],
  selectedUser: null,
  filters: initialFilters,
  pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
  loading: false,
  submitting: false,
  temporaryPasswordResult: null,
});

const memberRow = {
  id: 2,
  name: 'Bob',
  email: 'bob@example.com',
  role: ERole.Member,
  status: EUserStatus.Active,
  mustChangePassword: false,
  updatedAt: '2026-01-02T00:00:00.000Z',
};

const renderPage = (role: ERole = ERole.Admin) =>
  renderWithStore(<UsersPage />, makeTestStore({ auth: authState(role), users: usersState() }));

beforeEach(() => {
  vi.clearAllMocks();
  repoMocks.listUsersAsync.mockResolvedValue(emptyPage);
});

describe('<UsersPage />', () => {
  it('redirects a non-admin away from the page', () => {
    renderPage(ERole.Member);
    expect(screen.getByTestId('redirect')).toHaveTextContent('redirect:/');
    expect(repoMocks.listUsersAsync).not.toHaveBeenCalled();
  });

  it('fetches users on mount for an admin', () => {
    renderPage(ERole.Admin);
    expect(repoMocks.listUsersAsync).toHaveBeenCalledTimes(1);
  });

  it('renders the user rows returned by the repository', async () => {
    repoMocks.listUsersAsync.mockResolvedValue({
      success: true,
      data: { data: [memberRow], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } },
    });
    renderPage(ERole.Admin);
    expect(screen.getByRole('heading', { name: 'Users Management' })).toBeInTheDocument();
    expect(await screen.findByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
  });

  it('shows the empty-state message when the repository returns no users', async () => {
    renderPage(ERole.Admin);
    expect(await screen.findByText('Chưa có user nào.')).toBeInTheDocument();
  });

  it('opens the create-user dialog from the toolbar button', async () => {
    const user = userEvent.setup();
    renderPage(ERole.Admin);
    await screen.findByText('Chưa có user nào.');
    // Toolbar "Tạo user" button (the dialog also has one, so scope by dialog after click).
    await user.click(screen.getByRole('button', { name: 'Tạo user' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Tạo user mới' })).toBeInTheDocument();
  });

  it('refetches with page 1 when searching', async () => {
    const user = userEvent.setup();
    renderPage(ERole.Admin);
    await screen.findByText('Chưa có user nào.');
    repoMocks.listUsersAsync.mockClear();
    await user.type(screen.getByPlaceholderText('Tìm theo tên hoặc email'), 'bob');
    await user.click(screen.getByRole('button', { name: /Tìm kiếm/ }));
    expect(repoMocks.listUsersAsync).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'bob', page: 1 }),
    );
  });
});
