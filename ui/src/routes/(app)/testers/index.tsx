import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(app)/testers/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/testers/"!</div>
}
