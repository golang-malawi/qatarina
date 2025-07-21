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
    <Box minH="100vh" bg="gray.50" p={10}>
      <Stack gap={8} align="center" mb={10}>
        <Heading size="2xl" textAlign="center" color="teal.600">
          Welcome to the Future of Software Quality Assurance 
        </Heading>
        <Text fontSize="lg" color="gray.600" textAlign="center" maxW="3xl">
          Manage your testers, configure projects, and integrate with your
          favorite tools — all in one place.
        </Text>
      </Stack>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
        {/* Invite Your People */}
        <Box
          bg="white"
          p={6}
          rounded="xl"
          shadow="md"
          border="1px solid"
          borderColor="gray.200"
          _hover={{ shadow: "lg", transform: "translateY(-2px)" }}
          transition="all 0.2s"
        >
          <Flex align="center" mb={4}>
            <Icon as={IconUser} boxSize={6} color="teal.500" mr={2} />
            <Heading size="md" color="gray.700">
              Invite Your People
            </Heading>
          </Flex>
          <Stack gap={3}>
            <Link to="/testers/invite">
              <Button colorScheme="teal" variant="solid" w="full">
                Invite a Tester
              </Button>
            </Link>
            <Link to="/testers/invite">
              <Button colorScheme="teal" variant="outline" w="full">
                Invite an Admin
              </Button>
            </Link>
          </Stack>
        </Box>

        {/* Configure Projects */}
        <Box
          bg="white"
          p={6}
          rounded="xl"
          shadow="md"
          border="1px solid"
          borderColor="gray.200"
          _hover={{ shadow: "lg", transform: "translateY(-2px)" }}
          transition="all 0.2s"
        >
          <Flex align="center" mb={4}>
            <Icon as={IconSettings} boxSize={6} color="purple.500" mr={2} />
            <Heading size="md" color="gray.700">
              Configure Your Projects
            </Heading>
          </Flex>
          <Stack gap={3}>
            <Link to="/projects/new">
              <Button colorScheme="purple" variant="solid" w="full">
                Create a Project
              </Button>
            </Link>
            <Link to="/projects/import">
              <Button colorScheme="purple" variant="outline" w="full">
                Import from GitHub
              </Button>
            </Link>
          </Stack>
        </Box>

        {/* Manage Integrations */}
        <Box
          bg="white"
          p={6}
          rounded="xl"
          shadow="md"
          border="1px solid"
          borderColor="gray.200"
          _hover={{ shadow: "lg", transform: "translateY(-2px)" }}
          transition="all 0.2s"
        >
          <Flex align="center" mb={4}>
            <Icon as={IconPlug} boxSize={6} color="pink.500" mr={2} />
            <Heading size="md" color="gray.700">
              Manage Integrations
            </Heading>
          </Flex>
          <Stack gap={3}>
            <Link to="/integrations/asana">
              <Button colorScheme="pink" variant="solid" w="full">
                Asana Integration
              </Button>
            </Link>
            <Link to="/integrations/trello">
              <Button colorScheme="pink" variant="outline" w="full">
                Trello Integration
              </Button>
            </Link>
          </Stack>
        </Box>
      </SimpleGrid>
    </Box>
  );
}
