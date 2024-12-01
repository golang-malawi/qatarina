import { createFileRoute } from '@tanstack/react-router'
import TestCaseGrid from '../../../../../../components/TestCaseGrid'

export const Route = createFileRoute(
  '/(app)/_layout/projects/$projectId/test-plans/execute',
)({
  component: ExecuteTestPlan,
})

function ExecuteTestPlan() {
  return (
    <div>
      <TestCaseGrid />
    </div>
  )
}
