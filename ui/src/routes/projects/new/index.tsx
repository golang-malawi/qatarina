import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/projects/new/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/new/"!</div>
}
