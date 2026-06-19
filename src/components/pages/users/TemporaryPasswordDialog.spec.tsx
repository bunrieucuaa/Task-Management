import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TemporaryPasswordDialog from './TemporaryPasswordDialog';
import { ERole } from '@/app/shared/enums/ERole';
import { EUserStatus } from '@/app/shared/enums/EUserStatus';
import type { IUserWithTemporaryPasswordData } from '@/app/entities/user.entity';

const data: IUserWithTemporaryPasswordData = {
  temporaryPassword: 'Temp-Pass-123',
  user: {
    id: 7,
    name: 'Bob',
    email: 'bob@example.com',
    role: ERole.Member,
    status: EUserStatus.Active,
    avatarUrl: null,
    mustChangePassword: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
};

const setup = (over: Partial<React.ComponentProps<typeof TemporaryPasswordDialog>> = {}) => {
  const onClose = vi.fn();
  render(<TemporaryPasswordDialog open data={data} onClose={onClose} {...over} />);
  return { onClose };
};

describe('<TemporaryPasswordDialog />', () => {
  it('shows the user email and the one-time temporary password', () => {
    setup();
    expect(screen.getByRole('heading', { name: 'Mật khẩu tạm thời' })).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    expect(screen.getByText('Temp-Pass-123')).toBeInTheDocument();
  });

  it('calls onClose when the confirm button is clicked', async () => {
    const user = userEvent.setup();
    const { onClose } = setup();
    await user.click(screen.getByRole('button', { name: 'Đã copy xong' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders a placeholder dash when there is no data', () => {
    setup({ data: null });
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
