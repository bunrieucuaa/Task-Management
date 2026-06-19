import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithStore, makeTestStore } from '@/test/render';

const repo = vi.hoisted(() => ({
  listCommentsAsync: vi.fn(),
  createCommentAsync: vi.fn(),
  deleteCommentAsync: vi.fn(),
}));
vi.mock('@/app/repositories/CommentRepository', () => ({
  CommentRepository: vi.fn(() => repo),
}));

const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast: toastMock }));

import TaskCommentsDialog from './TaskCommentsDialog';

const task = { id: 5, title: 'Demo task' } as never;

const comment = {
  id: 1,
  content: 'First comment',
  userId: 1,
  createdAt: new Date('2026-06-18T10:00:00Z').toISOString(),
  user: { id: 1, name: 'Alice', avatarUrl: null },
};

const storeWithUser = () =>
  makeTestStore({
    auth: {
      loading: false,
      token: '',
      isAuthenticated: true,
      mustChangePassword: false,
      user: { id: 1, name: 'Alice', role: 'MEMBER' },
      initialized: true,
      initializing: false,
      userLoading: false,
    },
  });

beforeEach(() => vi.clearAllMocks());

describe('<TaskCommentsDialog />', () => {
  it('loads and renders the task comments when opened', async () => {
    repo.listCommentsAsync.mockResolvedValue({ success: true, data: { data: [comment] } });
    renderWithStore(
      <TaskCommentsDialog open onOpenChange={vi.fn()} task={task} />,
      storeWithUser(),
    );
    expect(repo.listCommentsAsync).toHaveBeenCalledWith(5);
    expect(await screen.findByText('First comment')).toBeInTheDocument();
  });

  it('submits a new comment through the repository', async () => {
    repo.listCommentsAsync.mockResolvedValue({ success: true, data: { data: [] } });
    repo.createCommentAsync.mockResolvedValue({
      success: true,
      data: { comment: { ...comment, id: 2, content: 'Hello' } },
    });
    const user = userEvent.setup();
    renderWithStore(
      <TaskCommentsDialog open onOpenChange={vi.fn()} task={task} />,
      storeWithUser(),
    );
    await user.type(screen.getByPlaceholderText(/Viết bình luận/i), 'Hello');
    await user.click(screen.getByRole('button', { name: 'Gửi bình luận' }));
    await waitFor(() =>
      expect(repo.createCommentAsync).toHaveBeenCalledWith(5, { content: 'Hello' }),
    );
  });

  it('disables the send button while the input is empty', async () => {
    repo.listCommentsAsync.mockResolvedValue({ success: true, data: { data: [] } });
    renderWithStore(
      <TaskCommentsDialog open onOpenChange={vi.fn()} task={task} />,
      storeWithUser(),
    );
    expect(screen.getByRole('button', { name: 'Gửi bình luận' })).toBeDisabled();
  });
});
