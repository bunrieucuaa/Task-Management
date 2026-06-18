import { describe, it, expect } from 'vitest';
import { isAuthenValidate } from './jwt.extention';

describe('isAuthenValidate', () => {
  it('matches a single string role (case-insensitive by default)', () => {
    expect(isAuthenValidate({ role: 'admin' }, ['ADMIN'])).toBe(true);
    expect(isAuthenValidate({ role: 'ADMIN' }, ['admin'])).toBe(true);
  });

  it('returns false when no role matches', () => {
    expect(isAuthenValidate({ role: 'MEMBER' }, ['ADMIN', 'PM'])).toBe(false);
  });

  it('scans any key containing "role" (e.g. roles array)', () => {
    expect(isAuthenValidate({ roles: ['MEMBER', 'PM'] }, ['ADMIN', 'PM'])).toBe(true);
  });

  it('flattens nested role arrays', () => {
    expect(isAuthenValidate({ userRoles: [['MEMBER'], ['ADMIN']] }, ['ADMIN'])).toBe(true);
  });

  it('respects case-sensitive mode when isUpperCase=false', () => {
    expect(isAuthenValidate({ role: 'admin' }, ['ADMIN'], false)).toBe(false);
    expect(isAuthenValidate({ role: 'ADMIN' }, ['ADMIN'], false)).toBe(true);
  });

  it('ignores non-role keys and non-string values', () => {
    expect(isAuthenValidate({ name: 'ADMIN', exp: 123 }, ['ADMIN'])).toBe(false);
  });
});
