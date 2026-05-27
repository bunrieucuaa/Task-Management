import _ from "lodash";

export const isAuthenValidate = (
  payload: Object,
  roles: string[],
  isUpperCase = true,
) => {
  const results = _.filter(payload, function (_v, k) {
    return _.includes(k.toUpperCase(), "role".toUpperCase());
  });
  const roleFromObjects = _.flattenDeep(results);

  const compareIgnoreCase = (str1: any, str2: any) => {
    if (isUpperCase) return str1.toLowerCase() === str2.toLowerCase();
    return str1 === str2;
  };
  const res = _.intersectionWith(roleFromObjects, roles, compareIgnoreCase);
  return res.length > 0;
};
