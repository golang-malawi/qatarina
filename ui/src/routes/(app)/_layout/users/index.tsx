import { Box, Heading } from '@chakra-ui/react'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(app)/_layout/users/')({
  component: ListUsers,
})

function ListUsers() {
  return (
    <Box>
      <Heading>Users</Heading>
    </Box>
  )
}
