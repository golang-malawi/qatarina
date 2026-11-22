import { createFileRoute, redirect } from "@tanstack/react-router";
import { findTestCaseInboxQueryOptions } from "@/data/queries/test-cases";
import { getLastProjectPath } from "@/lib/last-project";

// Landing page after login. Send people where their work is:
//   1. Inbox, when test cases are assigned to them and still open
//   2. otherwise the project they last worked in
//   3. otherwise the workspace dashboard
export const Route = createFileRoute("/(app)/")({
  beforeLoad: async ({ context: { queryClient } }) => {
    let openInboxCount = 0;
    try {
      // fetchQuery (not ensureQueryData) so a cached result from before login isn't reused.
      const inbox = await queryClient.fetchQuery(
        findTestCaseInboxQueryOptions(false, 1, 1),
      );
      openInboxCount =
        inbox?.pagination?.total ?? inbox?.test_cases?.length ?? 0;
    } catch {
      // If the inbox can't be loaded, fall through to the other options.
    }

    if (openInboxCount > 0) {
      throw redirect({ to: "/workspace/test-cases/inbox" });
    }

    const lastProjectPath = getLastProjectPath();
    if (lastProjectPath) {
      throw redirect({ to: lastProjectPath });
    }

    throw redirect({ to: "/workspace/dashboard" });
  },
  component: () => null,
});
