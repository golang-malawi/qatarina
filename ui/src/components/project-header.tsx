import { Project } from "@/services/ProjectService";
import { Avatar, Button, Flex, Icon, Menu, Portal } from "@chakra-ui/react";
import { Link } from "@tanstack/react-router";
import { LuChevronsUpDown } from "react-icons/lu";
import { MdHomeFilled } from "react-icons/md";

type Props = {
  loading: boolean;
  activeProject: string;
  projects: Project[];
};

const getActiveProject = (activeProject: string, projects: Project[]) => {
  return projects.find((project) => project.id === activeProject);
};

export const ProjectSiderbarHeader = ({ projects }: Props) => {
  const active = getActiveProject(projects[0].id, projects);
  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Flex>
          <Button variant="ghost" size="md" justifyContent="start" gap="2">
            <Avatar.Root shape="rounded">
              <Avatar.Fallback name={active?.title} />
            </Avatar.Root>
            {active?.title}
            <Flex flexGrow="1" justifyContent="end">
              <LuChevronsUpDown />
            </Flex>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/">
              <Icon>
                <MdHomeFilled />
              </Icon>
            </Link>
          </Button>
        </Flex>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content minW="56">
            <Menu.ItemGroup>
              <Menu.ItemGroupLabel>Projects</Menu.ItemGroupLabel>
              {projects.map((project, index) => (
                <Menu.Item key={project.id} value={project.id} asChild>
                  <Link
                    to={"/projects/$projectId"}
                    params={{ projectId: project.id }}
                  >
                    <>
                      <Avatar.Root shape="rounded">
                        <Avatar.Fallback name={project.title} />
                      </Avatar.Root>
                      {project.title}
                      <Menu.ItemCommand>{index + 1}</Menu.ItemCommand>
                    </>
                  </Link>
                </Menu.Item>
              ))}
            </Menu.ItemGroup>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};
