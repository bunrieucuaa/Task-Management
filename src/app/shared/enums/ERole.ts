export enum ERole {
  Admin = "ADMIN",
  PM = "PM",
  Member = "MEMBER"
}

/** Privileged roles: full project/member management (admin-equal for projects). */
export const PRIVILEGED_ROLES: ERole[] = [ERole.Admin, ERole.PM];

export const isPrivilegedRole = (role?: ERole | null): boolean =>
  role === ERole.Admin || role === ERole.PM;
