import { createFileRoute } from "@tanstack/react-router";
import TestCaseGrid from "@/components/TestCaseGrid";

export const Route = createFileRoute(
  "/(app)/projects/$projectId/test-plans/$testPlanID/execute/"
)({
  component: ExecuteTestPlan,
});

function ExecuteTestPlan() {
  return (
    <div>
      <TestCaseGrid />
    </div>
  );
}
