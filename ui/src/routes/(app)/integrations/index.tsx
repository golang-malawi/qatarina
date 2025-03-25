import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(app)/integrations/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/integrations/"!</div>
}
