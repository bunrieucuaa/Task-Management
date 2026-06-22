import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithStore } from '@/test/render';
import TagPicker from './TagPicker';
import type { ITag } from '@/app/entities/tag.entity';

const tags: ITag[] = [
  { id: 1, name: 'frontend' },
  { id: 2, name: 'urgent' },
];

beforeEach(() => vi.clearAllMocks());

describe('<TagPicker />', () => {
  it('shows the selected tags as badges on the trigger', () => {
    renderWithStore(
      <TagPicker tags={tags} selectedIds={[2]} canCreate={false} onToggle={vi.fn()} onCreate={vi.fn()} />,
    );
    expect(screen.getByText('urgent')).toBeInTheDocument();
  });

  it('toggles a tag when clicked in the list', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    renderWithStore(
      <TagPicker tags={tags} selectedIds={[]} canCreate={false} onToggle={onToggle} onCreate={vi.fn()} />,
    );
    await user.click(screen.getByRole('button', { name: /chọn nhãn/i }));
    await user.click(await screen.findByRole('option', { name: /frontend/i }));
    expect(onToggle).toHaveBeenCalledWith(tags[0]);
  });

  it('lets a privileged user create a tag inline', async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();
    renderWithStore(
      <TagPicker tags={tags} selectedIds={[]} canCreate onToggle={vi.fn()} onCreate={onCreate} />,
    );
    await user.click(screen.getByRole('button', { name: /chọn nhãn/i }));
    await user.type(await screen.findByPlaceholderText(/nhãn mới/i), 'backend');
    await user.click(screen.getByRole('button', { name: /^Tạo$/ }));
    expect(onCreate).toHaveBeenCalledWith('backend');
  });

  it('hides the create input from non-privileged users', async () => {
    const user = userEvent.setup();
    renderWithStore(
      <TagPicker tags={tags} selectedIds={[]} canCreate={false} onToggle={vi.fn()} onCreate={vi.fn()} />,
    );
    await user.click(screen.getByRole('button', { name: /chọn nhãn/i }));
    expect(screen.queryByPlaceholderText(/nhãn mới/i)).not.toBeInTheDocument();
  });
});
