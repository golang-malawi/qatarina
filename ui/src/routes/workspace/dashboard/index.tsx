import { createFileRoute } from "@tanstack/react-router";
import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  Icon,
  SimpleGrid,
  Text,
  Stack,
  Spinner,
} from "@chakra-ui/react";
import {
  IconDashboard,
  IconPlug,
  IconSettings,
  IconUser,
} from "@tabler/icons-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import $api from "@/lib/api/query";
import { SummaryCard } from "../../../components/SummaryCard";
import { Link } from "@tanstack/react-router";

function DashboardPage() {
  const {
    data,
    isPending,
    error,
  } = useSuspenseQuery($api.queryOptions("get", "/v1/dashboard/summary" as any, {}));

  if (isPending) return <Spinner size="xl" color="brand.solid" />;
  if (error) return <Text color="fg.error">Failed to load dashboard data.</Text>;

  const {
    project_count,
    tester_count,
    test_case_count,
    test_plan_count,
    closed_to_open_ratio,
    recent_projects,
  } = data;

  return (
    <Box p={6}>
      <Stack gap={8} align="center" mb={10} textAlign="center">
        <Heading size="2xl" textAlign="center" color="fg.heading">
          Welcome to the Future of Software Quality Assurance
        </Heading>
        <Text fontSize="lg" color="fg.muted" textAlign="center" maxW="3xl">
          Manage your testers, configure projects, and integrate with your
          favorite tools — all in one place.
        </Text>
      </Stack>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={6} mb={10}>
        <Box
          bg="bg.surface"
          p={6}
          rounded="xl"
          shadow="card"
          border="sm"
          borderColor="border.subtle"
          _hover={{
            shadow: "lg",
            transform: "translateY(calc(-1 * var(--chakra-space-0-5)))",
          }}
          transition="all 0.2s"
        >
          <Flex align="center" mb={4}>
            <Icon as={IconUser} boxSize={6} color="fg.accent" mr={2} />
            <Heading size="md" color="fg.heading">
              Invite Your People
            </Heading>
          </Flex>
          <Stack gap={3}>
            <Link to="/workspace/testers/invite">
              <Button colorPalette="brand" variant="solid" w="full">
                Invite a Tester
              </Button>
            </Link>
            <Link to="/workspace/testers/invite">
              <Button colorPalette="brand" variant="outline" w="full">
                Invite an Admin
              </Button>
            </Link>
          </Stack>
        </Box>

        <Box
          bg="bg.surface"
          p={6}
          rounded="xl"
          shadow="card"
          border="sm"
          borderColor="border.subtle"
          _hover={{
            shadow: "lg",
            transform: "translateY(calc(-1 * var(--chakra-space-0-5)))",
          }}
          transition="all 0.2s"
        >
          <Flex align="center" mb={4}>
            <Icon as={IconSettings} boxSize={6} color="info.solid" mr={2} />
            <Heading size="md" color="fg.heading">
              Configure Your Projects
            </Heading>
          </Flex>
          <Stack gap={3}>
            <Link to="/workspace/projects/new">
              <Button colorPalette="info" variant="solid" w="full">
                Create a Project
              </Button>
            </Link>
            <Link to="/">
              <Button colorPalette="info" variant="outline" w="full">
                Import from GitHub
              </Button>
            </Link>
          </Stack>
        </Box>

        <Box
          bg="bg.surface"
          p={6}
          rounded="xl"
          shadow="card"
          border="sm"
          borderColor="border.subtle"
          _hover={{
            shadow: "lg",
            transform: "translateY(calc(-1 * var(--chakra-space-0-5)))",
          }}
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

      <Heading
        mb={6}
        display="flex"
        alignItems="center"
        gap={2}
        color="fg.heading"
      >
        <IconDashboard /> Dashboard
      </Heading>

      <Grid
        templateColumns="repeat(auto-fit, minmax(var(--chakra-sizes-64), 1fr))"
        gap={6}
      >
        <SummaryCard label="Projects" value={project_count} />
        <SummaryCard label="Testers" value={tester_count} />
        <SummaryCard label="Test Cases" value={test_case_count} />
        <SummaryCard label="Test Plans" value={test_plan_count} />
        <SummaryCard
          label="Closed/Open Ratio"
          value={
            typeof closed_to_open_ratio === "number"
              ? closed_to_open_ratio.toFixed(2)
              : "N/A"
          }
        />
      </Grid>

      <Box mt={10}>
        <Heading size="md" mb={4} color="fg.heading">
          Recently Updated Projects
        </Heading>
        <Stack direction="column" align="start" gap={4}>
          {Array.isArray(recent_projects) && recent_projects.length > 0 ? (
            recent_projects.map(({ id, name, updated_at }) => (
              <Box
                key={id}
                p={3}
                border="sm"
                borderColor="border.subtle"
                borderRadius="lg"
                w="100%"
                bg="bg.surface"
                shadow="sm"
              >
                <Text fontWeight="bold" color="fg.heading">
                  {name}
                </Text>
                <Text fontSize="sm" color="fg.subtle">
                  Updated at: {new Date(updated_at).toLocaleString()}
                </Text>
              </Box>
            ))
          ) : (
            <Text color="fg.muted">No recent projects found.</Text>
          )}
        </Stack>
      </Box>
    </Box>
  );
}

export const Route = createFileRoute("/workspace/dashboard/")({
  component: DashboardPage,
});
