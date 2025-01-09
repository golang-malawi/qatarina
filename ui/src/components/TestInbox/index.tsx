import { Container, Box } from "@chakra-ui/react";

export default function TestInbox() {
  return (
    <Box flex={"column"}>
      <Container flex={"row"}>
        <Box bg="gray.500">Toolbox</Box>
        <Box>Tests listed here</Box>
      </Container>
      <Container></Container>
    </Box>
  );
}
