import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/workspace/testers/invite')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/workspace/testers/invite"!</div>
}
