import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/projects/$projectId/test-cases/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/view/test-cases/"!</div>
}
