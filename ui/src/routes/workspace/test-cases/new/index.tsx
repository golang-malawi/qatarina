import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute("/workspace/test-cases/new/")({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/workspace/test-cases/new/"!</div>
}
