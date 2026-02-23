import { Container, Box } from "@chakra-ui/react";

export default function TestInbox() {
  return (
    <Box flex={"column"}>
      <Container flex={"row"}>
        <Box bg="bg.subtle" color="fg.heading" px="3" py="2" borderRadius="md">
          Toolbox
        </Box>
        <Box>Tests listed here</Box>
      </Container>
      <Container></Container>
    </Box>
  );
}
