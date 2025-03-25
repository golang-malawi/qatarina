import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/projects/$projectId/testers/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/view/testers/"!</div>
}
