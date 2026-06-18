import { describe, it, expect } from 'vitest';
import { ERole, PRIVILEGED_ROLES, isPrivilegedRole } from './ERole';
import { EResultCode } from './EResultCode';

describe('ERole / isPrivilegedRole', () => {
  it('PRIVILEGED_ROLES contains ADMIN and PM only', () => {
    expect(PRIVILEGED_ROLES).toEqual([ERole.Admin, ERole.PM]);
  });

  it('isPrivilegedRole true for ADMIN/PM, false otherwise', () => {
    expect(isPrivilegedRole(ERole.Admin)).toBe(true);
    expect(isPrivilegedRole(ERole.PM)).toBe(true);
    expect(isPrivilegedRole(ERole.Member)).toBe(false);
    expect(isPrivilegedRole(null)).toBe(false);
    expect(isPrivilegedRole(undefined)).toBe(false);
  });
});

describe('EResultCode', () => {
  it('maps the HTTP status codes used by the interceptor', () => {
    expect(EResultCode.UNAUTHORIZED).toBe(401);
    expect(EResultCode.FORBIDDEN).toBe(403);
    expect(EResultCode.NOTFOUND).toBe(404);
    expect(EResultCode.INTERNALSERVERERROR).toBe(500);
  });
});
