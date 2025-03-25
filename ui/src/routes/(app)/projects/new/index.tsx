import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(app)/projects/new/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/new/"!</div>
}
