import { createFileRoute } from '@tanstack/react-router'
import { IconUser } from '@tabler/icons-react'
import { Box, Flex, Heading } from '@chakra-ui/react'

export const Route = createFileRoute('/(app)/_layout/dashboard/')({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Heading as="h1" size="2xl">
        Welcome to the future of Software Quality Assurance
      </Heading>
      <Box>
        <Heading size="xl">
          <IconUser /> Invite Your People
        </Heading>
        <Flex>
          <Box>
            {/* <Link to="/testers/invite">Invite a Tester</Link> */}
          </Box>
          <Box>
            {/* <Link to="/testers/invite">Invite an Admin</Link> */}
          </Box>
        </Flex>
      </Box>
      <Box>
        <Heading size="xl">
          <IconUser /> Configure Your Projects
        </Heading>
        <Flex>
          <Box>
            {/* <Link to="/testers/invite">Create a Project</Link> */}
          </Box>
          <Box>
            {/* <Link to="/testers/invite">Import Projects from GitHub</Link> */}
          </Box>
        </Flex>
      </Box>
      <Box>
        <Heading size="xl">
          <IconUser /> Manage Integrations
        </Heading>
        <Flex>
          <Box>
            {/* <Link to="/testers/invite">Asana Integration</Link> */}
          </Box>
          <Box>
            {/* <Link to="/testers/invite">Trello Integration</Link> */}
          </Box>
        </Flex>
      </Box>
    </main>
  )
}
