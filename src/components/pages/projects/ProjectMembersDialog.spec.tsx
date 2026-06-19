import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectMembersDialog from './ProjectMembersDialog';
import { ERole } from '@/app/shared/enums/ERole';
import { EProjectStatus } from '@/app/shared/enums/EProjectStatus';
import type { IProject, IProjectMember } from '@/app/entities/project.entity';
import type { IUserDirectoryItem } from '@/app/entities/user.entity';

const project: IProject = {
  id: 1,
  name: 'Apollo',
  description: null,
  ownerId: 1,
  status: EProjectStatus.Active,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  owner: null,
};

const members: IProjectMember[] = [
  {
    id: 1,
    userId: 1,
    role: 'OWNER',
    joinedAt: '2026-01-01T00:00:00.000Z',
    user: { id: 1, name: 'Alice', email: 'alice@example.com', avatarUrl: null },
  },
  {
    id: 2,
    userId: 2,
    role: 'MEMBER',
    joinedAt: '2026-01-02T00:00:00.000Z',
    user: { id: 2, name: 'Bob', email: 'bob@example.com', avatarUrl: null },
  },
];

const directory: IUserDirectoryItem[] = [
  { id: 2, name: 'Bob', email: 'bob@example.com', avatarUrl: null, role: ERole.Member },
  { id: 3, name: 'Carol', email: 'carol@example.com', avatarUrl: null, role: ERole.Member },
];

const setup = (over: Partial<React.ComponentProps<typeof ProjectMembersDialog>> = {}) => {
  const onOpenChange = vi.fn();
  const onAddMember = vi.fn().mockResolvedValue(undefined);
  const onRemoveMember = vi.fn().mockResolvedValue(undefined);
  render(
    <ProjectMembersDialog
      open
      onOpenChange={onOpenChange}
      project={project}
      members={members}
      membersLoading={false}
      submitting={false}
      manageable
      directory={directory}
      onAddMember={onAddMember}
      onRemoveMember={onRemoveMember}
      {...over}
    />,
  );
  return { onOpenChange, onAddMember, onRemoveMember };
};

describe('<ProjectMembersDialog />', () => {
  it('lists current members with the project name in the title', () => {
    setup();
    expect(screen.getByRole('heading', { name: /Apollo/ })).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Thành viên hiện có (2)')).toBeInTheDocument();
  });

  it('excludes existing members from the "add from system" list, keeping only Carol', () => {
    setup();
    // Carol is the only directory user not already a member → has an add button.
    expect(screen.getByText('carol@example.com · MEMBER')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Thêm/ })).toHaveLength(1);
  });

  it('filters the available users by the search box', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByPlaceholderText('Tìm theo tên hoặc email'), 'zzz');
    expect(screen.getByText('Không còn user nào để thêm.')).toBeInTheDocument();
  });

  it('adds a directory user when the add button is clicked', async () => {
    const user = userEvent.setup();
    const { onAddMember } = setup();
    await user.click(screen.getByRole('button', { name: /Thêm/ }));
    expect(onAddMember).toHaveBeenCalledWith(directory[1]); // Carol
  });

  it('removes a non-owner member; the owner has no remove button', async () => {
    const user = userEvent.setup();
    const { onRemoveMember } = setup();
    // Owner (Alice) row is disabled; only Bob exposes an enabled remove control.
    const removeButtons = screen
      .getAllByRole('button', { name: 'Remove member' })
      .filter((btn) => !(btn as HTMLButtonElement).disabled);
    expect(removeButtons).toHaveLength(1);
    await user.click(removeButtons[0]);
    expect(onRemoveMember).toHaveBeenCalledWith(2); // Bob's userId
  });

  it('hides the management section for non-managers', () => {
    setup({ manageable: false });
    expect(screen.queryByText('Thêm từ hệ thống')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove member' })).not.toBeInTheDocument();
  });
});
