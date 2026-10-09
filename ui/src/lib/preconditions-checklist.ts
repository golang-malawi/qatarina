/** localStorage key for a tester's ticked preconditions on a test case */
export function preconditionsChecklistKey(
  userId: number | string | undefined,
  testCaseId: string,
) {
  return `qatarina.checklist.${userId ?? "anon"}.${testCaseId}.preconditions`;
}
