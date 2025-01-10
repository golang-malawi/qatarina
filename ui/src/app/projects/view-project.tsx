import { useEffect, useState } from "react";
import { Outlet, useParams } from "react-router";
import ProjectService from "../../services/ProjectService";
import { Box, Flex, Heading } from "@chakra-ui/react";
import { Link } from "react-router-dom";

export default function ViewProject() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);

  const projectService = new ProjectService();
  useEffect(() => {
    projectService.findById(projectId!).then((data) => setProject(data));
  }, [projectId]);

  return (
    <Box>
      <Heading>{project?.title}</Heading>
      <Flex gap="2">
        <Link to={`/projects/view/${projectId}`}>Summary</Link>
        <Link to={`/projects/view/${projectId}/test-cases`}>Test-Cases</Link>
        <Link to={`/projects/view/${projectId}/test-plans`}>Test Plans</Link>
        <Link to={`/projects/view/${projectId}/testers`}>Testers</Link>
        <Link to={`/projects/view/${projectId}/reports`}>Reports</Link>
        <Link to={`/projects/view/${projectId}/insights`}>Insights</Link>
        <Link to={`/projects/view/${projectId}/settings`}>Settings</Link>
      </Flex>
      <Outlet />
    </Box>
  );
}
