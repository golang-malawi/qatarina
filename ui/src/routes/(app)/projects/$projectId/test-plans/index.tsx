import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(app)/projects/$projectId/test-plans/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/view/test-plans/"!</div>
}
