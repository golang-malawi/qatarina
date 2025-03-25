import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(app)/projects/$projectId/test-cases/new/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/$projectId/test-cases/new/"!</div>
}
