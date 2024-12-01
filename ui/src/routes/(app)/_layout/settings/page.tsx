import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(app)/_layout/settings/page')({
  component: SettingsIndex,
})

function SettingsIndex() {
  return (
    <div>
      <h1>Settings</h1>
    </div>
  )
}
