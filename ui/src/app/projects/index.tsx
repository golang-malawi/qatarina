import { Box, Button, Container, Flex } from "@chakra-ui/react";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import ProjectService from "../../services/ProjectService";

interface Project {
    id: string;
    title: string;
    project_url: string;
}

export default function Projects() {
    const projectService = new ProjectService();
    const { data: projects, isPending, error } = useQuery<Project[]>({
        queryFn: () => projectService.findAll().then(data => data),
        queryKey: ['projects'],
    });

    if (isPending) {
        return 'Loading Projects...'
    }

    if (error) {
        return <div className="error">Error: error fetching</div>
    }

    const projectList = projects.map(record => (
        <Container key={record.id} className="w-full">
            <h2>{record.title}</h2>
            <p>
                URL: <a href={record.project_url}>{record.project_url}</a>
            </p>
            <Flex>
                <Box>
                    <Button bg="black" color="white">Manage</Button>
                </Box>
                <Box>
                    <Button bg="blue.500" color="white">Add Testers</Button>
                </Box>
                <Box>
                    <Button bg="blue" color="white">Start Test Session</Button>
                </Box>
                <Box>
                    <Link to={`/projects/${record.id}/test-cases/new`}>
                        <Button bg="blue" color="white">Add Test Cases</Button>
                    </Link>
                </Box>
                <Box>
                    <Link to={`/projects/${record.id}/test-plans/new`}>
                        <Button bg="blue" color="white">Create Test Plan</Button>
                    </Link>
                </Box>
                <Box>
                    <Button bg="red" color="white"><IconTrash /></Button>
                </Box>
            </Flex>
        </Container>
    ))

    return (
        <div>
            Projects
            <Link to="/projects/new">
                <Button><IconPlus /> Create Project</Button>
            </Link>
            <hr />
            {projectList}
        </div>
    )
}