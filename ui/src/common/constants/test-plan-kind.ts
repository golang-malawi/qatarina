export const TEST_PLAN_KINDS = [
  "general",
  "adhoc",
  "triangle",
  "integration",
  "user_acceptance",
  "regression",
  "security",
  "user_interface",
  "scenario",
] as const;

export type TestPlanKind = (typeof TEST_PLAN_KINDS)[number];
