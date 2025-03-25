import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(auth)/logout')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(auth)/logout"!</div>
}
