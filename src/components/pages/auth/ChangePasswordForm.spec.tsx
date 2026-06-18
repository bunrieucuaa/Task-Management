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

const repo = vi.hoisted(() => ({ changePasswordAsync: vi.fn() }));
vi.mock('@/app/repositories/AuthRepository', () => ({ AuthRepository: vi.fn(() => repo) }));

import { ChangePasswordForm } from './ChangePasswordForm';
import { renderWithStore } from '@/test/render';

beforeEach(() => vi.clearAllMocks());

describe('<ChangePasswordForm />', () => {
  it('renders all three password fields', () => {
    renderWithStore(<ChangePasswordForm />);
    expect(screen.getByLabelText('Mật khẩu cũ (do Admin cấp)')).toBeInTheDocument();
    expect(screen.getByLabelText('Mật khẩu mới')).toBeInTheDocument();
    expect(screen.getByLabelText('Xác nhận mật khẩu mới')).toBeInTheDocument();
  });

  it('enforces password strength rules on the new password', async () => {
    const user = userEvent.setup();
    renderWithStore(<ChangePasswordForm />);

    await user.type(screen.getByLabelText('Mật khẩu cũ (do Admin cấp)'), 'oldpass');
    await user.type(screen.getByLabelText('Mật khẩu mới'), 'weak');
    await user.type(screen.getByLabelText('Xác nhận mật khẩu mới'), 'weak');
    await user.click(screen.getByRole('button', { name: 'Xác nhận đổi mật khẩu' }));

    expect(await screen.findByText('Mật khẩu phải có ít nhất 8 ký tự')).toBeInTheDocument();
    expect(repo.changePasswordAsync).not.toHaveBeenCalled();
  });

  it('rejects when confirmation does not match', async () => {
    const user = userEvent.setup();
    renderWithStore(<ChangePasswordForm />);

    await user.type(screen.getByLabelText('Mật khẩu cũ (do Admin cấp)'), 'OldPass1!');
    await user.type(screen.getByLabelText('Mật khẩu mới'), 'NewPass1!');
    await user.type(screen.getByLabelText('Xác nhận mật khẩu mới'), 'Different1!');
    await user.click(screen.getByRole('button', { name: 'Xác nhận đổi mật khẩu' }));

    expect(await screen.findByText('Mật khẩu xác nhận không khớp')).toBeInTheDocument();
  });

  it('submits and navigates to /login on success', async () => {
    repo.changePasswordAsync.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    renderWithStore(<ChangePasswordForm />);

    await user.type(screen.getByLabelText('Mật khẩu cũ (do Admin cấp)'), 'OldPass1!');
    await user.type(screen.getByLabelText('Mật khẩu mới'), 'NewPass1!');
    await user.type(screen.getByLabelText('Xác nhận mật khẩu mới'), 'NewPass1!');
    await user.click(screen.getByRole('button', { name: 'Xác nhận đổi mật khẩu' }));

    await waitFor(() => expect(repo.changePasswordAsync).toHaveBeenCalledWith({
      oldPassword: 'OldPass1!',
      newPassword: 'NewPass1!',
    }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: '/login' }));
    expect(toastMock.success).toHaveBeenCalled();
  });
});
