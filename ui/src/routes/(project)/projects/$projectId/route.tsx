import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Container, Flex } from "@chakra-ui/react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import AppSidebar from "@/components/app-sidebar";
import { ColorModeButton } from "@/components/ui/color-mode";
import { NavItem } from "@/lib/navigation";
import {
  FiBarChart2,
  FiClipboard,
  FiHome,
  FiInbox,
  FiSettings,
  FiUsers,
} from "react-icons/fi";
import { MdInsights } from "react-icons/md";
import { ProjectSiderbarHeader } from "@/components/project-header";
import { allProjectsQueryOptions } from "@/data/queries/projects";
import { useSuspenseQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/(project)/projects/$projectId")({
  component: RouteComponent,
});

const createProjectNavItems = (projectId: string): NavItem[] => {
  return [
    { path: `/projects/${projectId}`, name: "Project", icon: FiHome },
    {
      path: `/projects/${projectId}/test-plans`,
      name: "Test Plans",
      icon: FiInbox,
    },
    {
      path: `/projects/${projectId}/test-cases`,
      name: "Test Cases",
      icon: FiClipboard,
    },
    {
      path: `/projects/${projectId}/testers`,
      name: "Testers",
      icon: FiUsers,
    },
    {
      path: `/projects/${projectId}/reports`,
      name: "Reports",
      icon: FiBarChart2,
    },
    {
      path: `/projects/${projectId}/insights`,
      name: "Insights",
      icon: MdInsights,
    },
    {
      path: `/projects/${projectId}/settings`,
      name: "Settings",
      icon: FiSettings,
    },
  ];
};

function RouteComponent() {
  const { projectId } = Route.useParams();
  const { data: projects, isPending } = useSuspenseQuery(
    allProjectsQueryOptions
  );

  return (
    <SidebarProvider>
      <AppSidebar
        items={createProjectNavItems(projectId)}
        header={
          <ProjectSiderbarHeader
            projects={projects ?? []}
            activeProject={projectId}
            loading={isPending}
          />
        }
      />
      <SidebarInset className="flex min-h-screen flex-col items-center justify-between p-24">
        <Flex width={"100%"} padding={4} justifyContent="space-between">
          <SidebarTrigger />
          <ColorModeButton />
        </Flex>
        <Container>
          <Outlet />
        </Container>
      </SidebarInset>
    </SidebarProvider>
  );
}
