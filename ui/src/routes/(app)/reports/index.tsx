import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(app)/reports/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/reports/"!</div>
}
