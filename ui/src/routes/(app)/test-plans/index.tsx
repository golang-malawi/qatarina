import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(app)/test-plans/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/test-plans/"!</div>
}
