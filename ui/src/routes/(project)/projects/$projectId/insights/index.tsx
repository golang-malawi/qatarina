import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(project)/projects/$projectId/insights/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/view/insights/"!</div>
}
