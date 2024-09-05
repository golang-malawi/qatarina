import { Box, Button, Container, Flex } from "@chakra-ui/react";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import axios from 'axios';
import { useEffect, useState } from "react";
import { Link } from 'react-router-dom';

export default function Projects() {
    const [records, setRecords] = useState([]);

    useEffect(() => {

        async function getProjects() {
            const res = await axios.get('http://localhost:4597/v1/projects')
            if (res.status == 200) {
                setRecords(res.data.projects)
            }
        }

        getProjects()

        return () => { }
    }, []);

    const projectList = records.map(record => (
        <Container key={record.id} className="w-full">
            <h2>{record.title}</h2>
            <p>
                URL: <Link href={record.project_url}>{record.project_url}</Link>
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
                    <Button bg="blue" color="white">Add Test Cases</Button>
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