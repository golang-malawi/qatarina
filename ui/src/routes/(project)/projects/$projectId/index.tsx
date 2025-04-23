import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Outlet } from "@tanstack/react-router";
import ProjectService from "@/services/ProjectService";
import { Box, Flex, Heading } from "@chakra-ui/react";
import { Project } from "@/common/models";

export const Route = createFileRoute("/(project)/projects/$projectId/")({
  component: ViewProject,
});

function ViewProject() {
  const { projectId } = Route.useParams();
  const [project, setProject] = useState<Project | null>(null);

  const projectService = new ProjectService();
  useEffect(() => {
    projectService.findById(projectId!).then((data) => setProject(data));
  }, [projectId]);

  return (
    <Box>
      <Heading>{project?.title}</Heading>
      <Flex gap="2">
        <Link
          to={`/projects/$projectId`}
          params={{
            projectId: projectId,
          }}
        >
          Summary
        </Link>
        <Link
          to={`/projects/$projectId/test-cases`}
          params={{
            projectId: projectId,
          }}
        >
          Test-Cases
        </Link>
        <Link
          to={`/projects/$projectId/test-plans`}
          params={{
            projectId: projectId,
          }}
        >
          Test Plans
        </Link>
        <Link
          to={`/projects/$projectId/testers`}
          params={{
            projectId: projectId,
          }}
        >
          Testers
        </Link>
        <Link
          to={`/projects/$projectId/reports`}
          params={{
            projectId: projectId,
          }}
        >
          Reports
        </Link>
        <Link
          to={`/projects/$projectId/insights`}
          params={{
            projectId: projectId,
          }}
        >
          Insights
        </Link>
        <Link
          to={`/projects/$projectId/settings`}
          params={{
            projectId: projectId,
          }}
        >
          Settings
        </Link>
      </Flex>
      <Outlet />
    </Box>
  );
}
