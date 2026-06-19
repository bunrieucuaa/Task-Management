import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserCreateDialog from './UserCreateDialog';

const setup = (over: Partial<React.ComponentProps<typeof UserCreateDialog>> = {}) => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onOpenChange = vi.fn();
  render(
    <UserCreateDialog
      open
      onOpenChange={onOpenChange}
      submitting={false}
      onSubmit={onSubmit}
      {...over}
    />,
  );
  return { onSubmit, onOpenChange };
};

describe('<UserCreateDialog />', () => {
  it('renders the create form when open', () => {
    setup();
    expect(screen.getByRole('heading', { name: 'Tạo user mới' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nguyen Van A')).toBeInTheDocument();
  });

  it('shows validation errors and does not submit an empty form', async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();
    await user.click(screen.getByRole('button', { name: 'Tạo user' }));
    expect(await screen.findByText('Họ và tên không được để trống')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits trimmed values with the default MEMBER role', async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();
    await user.type(screen.getByPlaceholderText('Nguyen Van A'), '  Alice  ');
    await user.type(screen.getByPlaceholderText('nguyenvana@example.com'), 'alice@example.com');
    await user.click(screen.getByRole('button', { name: 'Tạo user' }));
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Alice',
      email: 'alice@example.com',
      role: 'MEMBER',
    });
  });
});
