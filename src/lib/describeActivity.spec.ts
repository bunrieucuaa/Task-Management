import { describe, it, expect } from 'vitest';
import { describeActivity } from './describeActivity';
import type { IActivity } from '@/app/entities/activity.entity';

const base = {
  id: 1,
  taskId: 5,
  userId: 2,
  createdAt: '2026-06-22T00:00:00.000Z',
  user: { id: 2, name: 'An', email: 'an@x.io', avatarUrl: null },
} as const;

const make = (over: Partial<IActivity>): IActivity =>
  ({ ...base, oldValue: null, newValue: null, ...over } as IActivity);

describe('describeActivity', () => {
  it('describes task creation', () => {
    const text = describeActivity(make({ action: 'TASK_CREATED', newValue: { title: 'Fix bug' } }));
    expect(text).toContain('tạo');
  });

  it('describes a status change with readable labels', () => {
    const text = describeActivity(
      make({ action: 'STATUS_CHANGED', oldValue: { status: 'TODO' }, newValue: { status: 'IN_PROGRESS' } }),
    );
    expect(text).toContain('trạng thái');
    expect(text).toContain('To Do');
    expect(text).toContain('In Progress');
  });

  it('describes a priority change with readable labels', () => {
    const text = describeActivity(
      make({ action: 'PRIORITY_CHANGED', oldValue: { priority: 'LOW' }, newValue: { priority: 'HIGH' } }),
    );
    expect(text).toContain('độ ưu tiên');
    expect(text).toContain('Low');
    expect(text).toContain('High');
  });

  it('describes adding a tag', () => {
    expect(describeActivity(make({ action: 'TAG_ADDED', newValue: { tagId: 3 } }))).toContain('gắn nhãn');
  });

  it('describes removing a tag', () => {
    expect(describeActivity(make({ action: 'TAG_REMOVED', oldValue: { tagId: 3 } }))).toContain('gỡ nhãn');
  });

  it('describes assignee change (assigned)', () => {
    expect(
      describeActivity(make({ action: 'ASSIGNEE_CHANGED', oldValue: { assigneeId: null }, newValue: { assigneeId: 9 } })),
    ).toContain('người phụ trách');
  });

  it('describes a deadline change', () => {
    expect(
      describeActivity(make({ action: 'DEADLINE_CHANGED', oldValue: { deadline: null }, newValue: { deadline: '2026-07-01T00:00:00.000Z' } })),
    ).toContain('hạn');
  });

  it('falls back to a generic description for unknown actions', () => {
    const text = describeActivity(make({ action: 'SOMETHING_ELSE' as never }));
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(0);
  });
});
