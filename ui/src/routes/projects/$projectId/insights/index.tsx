import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/projects/$projectId/insights/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/view/insights/"!</div>
}
