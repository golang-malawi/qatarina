import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(app)/projects/$projectId/insights/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/view/insights/"!</div>
}
