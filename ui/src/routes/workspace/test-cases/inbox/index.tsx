import { createFileRoute } from "@tanstack/react-router";
import { Flex, Heading, Text } from "@chakra-ui/react";

export const Route = createFileRoute("/workspace/test-cases/inbox/")({
  component: () => (
    <Flex
      direction="column"
      align="center"
      justify="center"
      h="100%"
      color="fg.subtle"
      textAlign="center"
    >
      <Heading size="md" mb={4}>
        Select a Test Case
      </Heading>
      <Text fontSize="lg">
        Choose a test case from the left to record results here.
      </Text>
    </Flex>
  ),
});
