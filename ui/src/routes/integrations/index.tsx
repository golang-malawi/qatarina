import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/integrations/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/integrations/"!</div>
}
