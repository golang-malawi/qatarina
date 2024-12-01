import { Box, Heading } from '@chakra-ui/react'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(app)/_layout/users/$userId')({
  component: ViewUserProfile,
})

function ViewUserProfile() {
  return (
    <Box>
      <Heading>View Profile: </Heading>
    </Box>
  )
}
