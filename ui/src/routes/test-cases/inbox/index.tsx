import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/test-cases/inbox/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/test-cases/inbox/"!</div>
}
