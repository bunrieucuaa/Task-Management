import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const navigate = vi.hoisted(() => vi.fn());
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  Link: ({ children, ...props }: { children: React.ReactNode }) => <a {...props}>{children}</a>,
}));

const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('sonner', () => ({ toast: toastMock }));

const repo = vi.hoisted(() => ({ postLoginTokenAsync: vi.fn() }));
vi.mock('@/app/repositories/AuthRepository', () => ({ AuthRepository: vi.fn(() => repo) }));

vi.mock('jwt-decode', () => ({
  jwtDecode: () => ({ role: 'ADMIN', exp: Math.floor(Date.now() / 1000) + 3600 }),
}));

import { LoginForm } from './LoginForm';
import { renderWithStore } from '@/test/render';

beforeEach(() => vi.clearAllMocks());

describe('<LoginForm />', () => {
  it('renders the email and password fields', () => {
    renderWithStore(<LoginForm />);
    expect(screen.getByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Mật khẩu')).toBeInTheDocument();
  });

  it('shows validation errors when submitting an empty form', async () => {
    const user = userEvent.setup();
    renderWithStore(<LoginForm />);
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(await screen.findByText('Email không hợp lệ')).toBeInTheDocument();
    expect(screen.getByText('Mật khẩu không được trống')).toBeInTheDocument();
    expect(repo.postLoginTokenAsync).not.toHaveBeenCalled();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderWithStore(<LoginForm />);
    const input = screen.getByLabelText('Mật khẩu') as HTMLInputElement;
    expect(input.type).toBe('password');
    await user.click(screen.getByRole('button', { name: 'Hiện mật khẩu' }));
    expect(input.type).toBe('text');
  });

  it('dispatches login and navigates home on a valid submit', async () => {
    repo.postLoginTokenAsync.mockResolvedValue({
      success: true,
      data: {
        accessToken: 'a.jwt',
        refreshToken: 'r.jwt',
        user: { id: 1, name: 'A', role: 'ADMIN' },
        mustChangePassword: false,
      },
    });

    const user = userEvent.setup();
    renderWithStore(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'admin@example.com');
    await user.type(screen.getByLabelText('Mật khẩu'), 'Secret123!');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    await waitFor(() => expect(repo.postLoginTokenAsync).toHaveBeenCalled());
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: '/' }));
    expect(toastMock.success).toHaveBeenCalled();
  });
});
