import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskFormDialog from './TaskFormDialog';

const projects = [{ id: 1, name: 'Project One' }] as never;

const setup = (over: Partial<React.ComponentProps<typeof TaskFormDialog>> = {}) => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onProjectChange = vi.fn();
  render(
    <TaskFormDialog
      open
      onOpenChange={vi.fn()}
      submitting={false}
      projects={projects}
      members={[]}
      onProjectChange={onProjectChange}
      onSubmit={onSubmit}
      {...over}
    />,
  );
  return { onSubmit, onProjectChange };
};

describe('<TaskFormDialog />', () => {
  it('asks the parent to load members for the preselected project on open', () => {
    const { onProjectChange } = setup({ defaultProjectId: 1 });
    expect(onProjectChange).toHaveBeenCalledWith(1);
  });

  it('submits normalized values for a new task', async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup({ defaultProjectId: 1 });
    await user.type(screen.getByPlaceholderText('Thiết kế trang đăng nhập'), 'New task');
    await user.click(screen.getByRole('button', { name: 'Tạo task' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit).toHaveBeenCalledWith({
      projectId: 1,
      title: 'New task',
      description: '',
      assigneeId: null,
      priority: 'MEDIUM',
      deadline: null,
    });
  });

  it('requires a project before submitting', async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup(); // no defaultProjectId
    await user.type(screen.getByPlaceholderText('Thiết kế trang đăng nhập'), 'Orphan');
    await user.click(screen.getByRole('button', { name: 'Tạo task' }));
    expect(await screen.findByText('Vui lòng chọn project')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows the edit title when editing an existing task', () => {
    setup({ task: { id: 3, projectId: 1, title: 'Edit me' } as never });
    expect(screen.getByRole('heading', { name: 'Cập nhật task' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Edit me')).toBeInTheDocument();
  });
});
