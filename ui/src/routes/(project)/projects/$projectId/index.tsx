import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Box, Flex, Button } from "@chakra-ui/react";

export const Route = createFileRoute("/(project)/projects/$projectId/")({
  component: ViewProject,
});

function ViewProject() {
  const { projectId } = Route.useParams();
  // const matchRoute = useMatchRoute();

  const navItems = [
    { label: "Summary", path: `/projects/$projectId` },
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
        borderBottom="1px solid"
        borderColor="gray.200"
        bg="gray.50"
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
                colorScheme="teal"
                size="sm"
              >
                {item.label}
              </Button>
            </Link>
          );
        })}
      </Flex>

      <Box p={4}>
        <Outlet />
      </Box>
    </Box>
  );
}
