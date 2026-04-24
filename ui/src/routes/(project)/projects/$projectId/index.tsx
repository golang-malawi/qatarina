import { createFileRoute, Link} from "@tanstack/react-router";
import { Box, Flex, Button, Heading, Text, Stack, Spinner } from "@chakra-ui/react";
import { useProjectQuery } from "@/services/ProjectService";

export const Route = createFileRoute("/(project)/projects/$projectId/")({
  component: ViewProject,
});

function ViewProject() {
  const { projectId } = Route.useParams();
  const { data: project, isLoading, error } = useProjectQuery(projectId!);
  
  if (isLoading) return <Spinner color="brand.solid" />;
  if (error) return <Text color="fg.error">Error loading project.</Text>;
  // const matchRoute = useMatchRoute();

  const navItems = [
    { label: "Summary", path: `/projects/$projectId/summary` },
    { label: "Test Cases", path: `/projects/$projectId/test-cases` },
    { label: "Test Plans", path: `/projects/$projectId/test-plans` },
    { label: "Features/Modules", path: `/projects/$projectId/Features` },
    { label: "Testers", path: `/projects/$projectId/testers` },
    { label: "Reports", path: `/projects/$projectId/reports` },
    { label: "Insights", path: `/projects/$projectId/insights` },
    { label: "Settings", path: `/projects/$projectId/settings` },
    {label: "Environments", path: `/projects/$projectId/environments`},
  ];

  return (
    <Box>
      <Flex
        gap="2"
        p={4}
        borderBottom="sm"
        borderColor="border.subtle"
        bg="bg.surface"
        overflowX="auto"
      >
        {navItems.map((item) => {
          const isActive = false;
          // TODO: const isActive = matchRoute({item.path.replace("$projectId", projectId));
          return (
            <Link
              key={item.label}
              to={item.path}
              params={{ projectId }}
            >
              <Button
                variant={isActive ? "solid" : "ghost"}
                colorPalette="brand"
                size="sm"
              >
                {item.label}
              </Button>
            </Link>
          );
        })}
      </Flex>

      <Box p={6}>
        <Heading size="lg" mb={4} color="tg.heading">
          Welcome to {project?.title ? `${project.title} Project` : "Your Project"}
        </Heading>
        <Text mb={4} color="fg.subtle">
          Here’s how the testing process works in this project:
        </Text>
         <Stack gap={3}>
          <Text>• Create <strong>Test Cases</strong> for the project.</Text>
          <Text>• Add those test cases into a <strong>Test Plan</strong>.</Text>
          <Text>• Assign users to execute the test cases in the plan.</Text>
          <Text>• Assigned test cases appear in each tester’s <strong>Inbox</strong>.</Text>
          <Text>• When a tester opens a case, they record results and mark it as <strong>Passed</strong> or <strong>Failed</strong>.</Text>
          <Text>• Each submission creates a <strong>Test Run</strong> (case + result).</Text>
          <Text>• Test runs are visible under the project’s Test Plan → Test Runs.</Text>
          <Text>• Users can close individual test runs once complete.</Text>
          <Text>• A Test Plan can only be closed once all its test runs are closed.</Text>
        </Stack>
        <Text mt={6} color="fg.muted">
          Need help? Visit the Settings page or contact your project owner.
        </Text>
      </Box>
    </Box>
  );
}
