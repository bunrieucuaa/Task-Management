export const isAuthenValidate = (
  payload: object,
  roles: string[],
  isUpperCase = true,
) => {
  const roleValues = Object.entries(payload as Record<string, unknown>)
    .filter(([key]) => key.toLowerCase().includes("role"))
    .flatMap(([, value]) => (Array.isArray(value) ? value.flat(Infinity) : [value]));

  const compareIgnoreCase = (value: unknown, role: string) => {
    if (typeof value !== "string") {
      return false;
    }

    if (isUpperCase) {
      return value.toLowerCase() === role.toLowerCase();
    }

    return value === role;
  };

  return roleValues.some((value) =>
    roles.some((role) => compareIgnoreCase(value, role)),
  );
};
