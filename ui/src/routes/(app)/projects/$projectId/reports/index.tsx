import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(app)/projects/$projectId/reports/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/view/reports/"!</div>
}
