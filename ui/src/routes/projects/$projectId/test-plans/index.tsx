import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/projects/$projectId/test-plans/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/view/test-plans/"!</div>
}
