import { createFileRoute } from "@tanstack/react-router";
import {
  Box,
  Flex,
  Heading,
  Text,
  Stack,
  Button,
  SimpleGrid,
  Icon,
} from "@chakra-ui/react";
import { IconUser, IconSettings, IconPlug } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/")({
  component: Home,
});

function Home() {
  return (
    <Box minH="100vh" bg="bg.canvas" p={10}>
      <Stack gap={8} align="center" mb={10}>
        <Heading size="2xl" textAlign="center" color="fg.heading">
          Welcome to the Future of Software Quality Assurance 
        </Heading>
        <Text fontSize="lg" color="fg.muted" textAlign="center" maxW="3xl">
          Manage your testers, configure projects, and integrate with your
          favorite tools — all in one place.
        </Text>
      </Stack>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
        {/* Invite Your People */}
        <Box
          bg="bg.surface"
          p={6}
          rounded="xl"
          shadow="card"
          border="sm"
          borderColor="border.subtle"
          _hover={{ shadow: "lg", transform: "translateY(calc(-1 * var(--chakra-space-0-5)))" }}
          transition="all 0.2s"
        >
          <Flex align="center" mb={4}>
            <Icon as={IconUser} boxSize={6} color="fg.accent" mr={2} />
            <Heading size="md" color="fg.heading">
              Invite Your People
            </Heading>
          </Flex>
          <Stack gap={3}>
            <Link to="/testers/invite">
              <Button colorPalette="brand" variant="solid" w="full">
                Invite a Tester
              </Button>
            </Link>
            <Link to="/testers/invite">
              <Button colorPalette="brand" variant="outline" w="full">
                Invite an Admin
              </Button>
            </Link>
          </Stack>
        </Box>

        {/* Configure Projects */}
        <Box
          bg="bg.surface"
          p={6}
          rounded="xl"
          shadow="card"
          border="sm"
          borderColor="border.subtle"
          _hover={{ shadow: "lg", transform: "translateY(calc(-1 * var(--chakra-space-0-5)))" }}
          transition="all 0.2s"
        >
          <Flex align="center" mb={4}>
            <Icon as={IconSettings} boxSize={6} color="info.solid" mr={2} />
            <Heading size="md" color="fg.heading">
              Configure Your Projects
            </Heading>
          </Flex>
          <Stack gap={3}>
            <Link to="/projects/new">
              <Button colorPalette="info" variant="solid" w="full">
                Create a Project
              </Button>
            </Link>
            <Link to="/"> {/* TODO: fix link */}
              <Button colorPalette="info" variant="outline" w="full">
                Import from GitHub
              </Button>
            </Link>
          </Stack>
        </Box>

        {/* Manage Integrations */}
        <Box
          bg="bg.surface"
          p={6}
          rounded="xl"
          shadow="card"
          border="sm"
          borderColor="border.subtle"
          _hover={{ shadow: "lg", transform: "translateY(calc(-1 * var(--chakra-space-0-5)))" }}
          transition="all 0.2s"
        >
          <Flex align="center" mb={4}>
            <Icon as={IconPlug} boxSize={6} color="warning.solid" mr={2} />
            <Heading size="md" color="fg.heading">
              Manage Integrations
            </Heading>
          </Flex>
          <Stack gap={3}>
            <Link to="/">
              <Button colorPalette="warning" variant="solid" w="full">
                Asana Integration
              </Button>
            </Link>
            <Link to="/">
              <Button colorPalette="warning" variant="outline" w="full">
                Trello Integration
              </Button>
            </Link>
          </Stack>
        </Box>
      </SimpleGrid>
    </Box>
  );
}
