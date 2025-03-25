import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(app)/projects/$projectId/test-plans/new/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/$projectId/test-plans/new/"!</div>
}
