import Image from "next/image";
import PocketBase from "pocketbase";
import Link from "next/link";
import { Box, Button, Container, Flex } from "@chakra-ui/react";
import { IconTrash } from "@tabler/icons-react";

export default async function Projects() {

  const pb = new PocketBase('http://127.0.0.1:8090');
  // you can also fetch all records at once via getFullList
  const records = await pb.collection('projects').getFullList({
    sort: '-created',
  });

  const projectList = records.map(record => (
    <Container key={record.id} className="w-full">
      <h2>{record.title}</h2>
      <p>
        URL: <Link href={record.project_url}>{record.project_url}</Link>
      </p>
      <Flex>
        <Box>
          <Button bg="black"color="white">Manage</Button>
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
      <hr />
      {projectList}
    </div>
  )
}