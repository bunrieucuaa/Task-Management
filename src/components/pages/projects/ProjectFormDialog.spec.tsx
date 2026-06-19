import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectFormDialog from './ProjectFormDialog';

const directory = [
  { id: 1, name: 'Owner', email: 'owner@e.com', role: 'PM' },
  { id: 2, name: 'Bob', email: 'bob@e.com', role: 'MEMBER' },
] as never;

const setup = (over: Partial<React.ComponentProps<typeof ProjectFormDialog>> = {}) => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  render(
    <ProjectFormDialog
      open
      onOpenChange={vi.fn()}
      submitting={false}
      directory={directory}
      currentUserId={1}
      onSubmit={onSubmit}
      {...over}
    />,
  );
  return { onSubmit };
};

describe('<ProjectFormDialog /> — create mode', () => {
  it('renders the create title and a member picker excluding the owner', () => {
    setup();
    expect(screen.getByRole('heading', { name: 'Tạo project mới' })).toBeInTheDocument();
    // Owner (id 1) is excluded; only Bob is pickable.
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.queryByText('Owner')).not.toBeInTheDocument();
  });

  it('submits the trimmed name with the selected member ids', async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();
    await user.type(screen.getByPlaceholderText('Website Redesign'), '  Redesign  ');
    await user.click(screen.getByRole('checkbox')); // select Bob (id 2)
    await user.click(screen.getByRole('button', { name: 'Tạo project' }));
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Redesign',
      description: '',
      memberIds: [2],
    });
  });

  it('blocks submit and shows an error when the name is empty', async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();
    await user.click(screen.getByRole('button', { name: 'Tạo project' }));
    expect(await screen.findByText('Tên project không được để trống')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('<ProjectFormDialog /> — edit mode', () => {
  it('prefills the name, hides the member picker, and submits with empty memberIds', async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup({
      project: { id: 9, name: 'Existing', description: 'desc' } as never,
    });
    expect(screen.getByRole('heading', { name: 'Cập nhật project' })).toBeInTheDocument();
    expect(screen.queryByText('Thành viên ban đầu')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Existing',
      description: 'desc',
      memberIds: [],
    });
  });
});
