import { describe, it, expect } from 'vitest';
import { TAG_COLORS, tagColor } from './tagColor';

describe('tagColor', () => {
  it('returns a class string from the fixed palette', () => {
    expect(TAG_COLORS).toContain(tagColor('urgent'));
  });

  it('is deterministic for the same name', () => {
    expect(tagColor('frontend')).toBe(tagColor('frontend'));
  });

  it('is case-insensitive and trims whitespace', () => {
    expect(tagColor('  Frontend ')).toBe(tagColor('frontend'));
  });

  it('does not throw on an empty name', () => {
    expect(() => tagColor('')).not.toThrow();
    expect(TAG_COLORS).toContain(tagColor(''));
  });
});
