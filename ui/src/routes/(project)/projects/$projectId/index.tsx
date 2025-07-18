import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Box, Flex } from "@chakra-ui/react";

export const Route = createFileRoute("/(project)/projects/$projectId/")({
  component: ViewProject,
});

function ViewProject() {
  const { projectId } = Route.useParams();

  return (
    <Box>
      <Flex gap="2">
        <Link to={`/projects/$projectId`} params={{ projectId: projectId }}>
          Summary
        </Link>
        <Link
          to={`/projects/$projectId/test-cases`}
          params={{ projectId: projectId }}
        >
          Test-Cases
        </Link>
        <Link
          to={`/projects/$projectId/test-plans`}
          params={{ projectId: projectId }}
        >
          Test Plans
        </Link>
        <Link
          to={`/projects/$projectId/Features`}
          params={{
            projectId: projectId,
          }}
        >
        Features/Modules
        </Link>
        <Link
          to={`/projects/$projectId/testers`}
          params={{ projectId: projectId }}
        >
          Testers
        </Link>
        <Link
          to={`/projects/$projectId/reports`}
          params={{ projectId: projectId }}
        >
          Reports
        </Link>
        <Link
          to={`/projects/$projectId/insights`}
          params={{ projectId: projectId }}
        >
          Insights
        </Link>
        <Link
          to={`/projects/$projectId/settings`}
          params={{ projectId: projectId }}
        >
          Settings
        </Link>
      </Flex>
      <Outlet />
    </Box>
  );
}
