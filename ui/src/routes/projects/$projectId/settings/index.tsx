import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/projects/$projectId/settings/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/view/settings/"!</div>
}
