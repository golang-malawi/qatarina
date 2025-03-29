import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(app)/testers/invite')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(app)/testers/invite"!</div>
}
