import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithStore, makeTestStore } from '@/test/render';

const repo = vi.hoisted(() => ({ listByTaskAsync: vi.fn() }));
vi.mock('@/app/repositories/ActivityRepository', () => ({
  ActivityRepository: vi.fn(() => repo),
}));

import TaskActivityDialog from './TaskActivityDialog';

const task = { id: 5, title: 'Demo task' } as never;

const activity = (over: Record<string, unknown> = {}) => ({
  id: 1,
  taskId: 5,
  userId: 2,
  action: 'STATUS_CHANGED',
  oldValue: { status: 'TODO' },
  newValue: { status: 'IN_PROGRESS' },
  createdAt: new Date('2026-06-20T10:00:00Z').toISOString(),
  user: { id: 2, name: 'An', avatarUrl: null },
  ...over,
});

beforeEach(() => vi.clearAllMocks());

describe('<TaskActivityDialog />', () => {
  it('loads and renders the task activities when opened', async () => {
    repo.listByTaskAsync.mockResolvedValue({
      success: true,
      data: { data: [activity()], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } },
    });
    renderWithStore(
      <TaskActivityDialog open onOpenChange={vi.fn()} task={task} />,
      makeTestStore(),
    );
    expect(repo.listByTaskAsync).toHaveBeenCalledWith(5);
    expect(await screen.findByText(/đổi trạng thái/)).toBeInTheDocument();
    expect(screen.getByText('An')).toBeInTheDocument();
  });

  it('shows an empty state when there are no activities', async () => {
    repo.listByTaskAsync.mockResolvedValue({
      success: true,
      data: { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
    });
    renderWithStore(
      <TaskActivityDialog open onOpenChange={vi.fn()} task={task} />,
      makeTestStore(),
    );
    expect(await screen.findByText(/Chưa có hoạt động/i)).toBeInTheDocument();
  });

  it('does not fetch when closed', () => {
    renderWithStore(
      <TaskActivityDialog open={false} onOpenChange={vi.fn()} task={task} />,
      makeTestStore(),
    );
    expect(repo.listByTaskAsync).not.toHaveBeenCalled();
  });
});
