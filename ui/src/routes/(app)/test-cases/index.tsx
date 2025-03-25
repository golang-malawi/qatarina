import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(app)/test-cases/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/test-cases/"!</div>
}
