import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/users/view/$userID')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/users/view/$userID"!</div>
}
