import { createFileRoute } from "@tanstack/react-router";
import { Circle, Flex, Heading, HStack, Icon, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuMousePointerClick } from "react-icons/lu";

export const Route = createFileRoute("/workspace/test-cases/inbox/")({
  component: InboxStart,
});

// Shown in the right-hand pane until a test case is picked from the list
function InboxStart() {
  const { t } = useTranslation();
  const steps = [
    t("inbox.start.step1", "Pick a test case from the list on the left."),
    t("inbox.start.step2", "Follow its steps and write down what happened."),
    t("inbox.start.step3", "Mark it as Passed or Failed. The next test case opens for you."),
  ];

  return (
    <Flex direction="column" align="center" justify="center" h="full" minH="xs" textAlign="center">
      <Stack gap={5} maxW="md" align="center">
        <Icon as={LuMousePointerClick} boxSize="10" color="fg.subtle" />
        <Heading size="md" color="fg.heading">
          {t("inbox.start.title", "Choose a test case to start testing")}
        </Heading>
        <Stack gap={3} align="stretch" textAlign="left">
          {steps.map((step, i) => (
            <HStack key={step} gap={3} align="start">
              <Circle size="6" bg="brand.subtle" color="brand.fg" fontSize="xs" fontWeight="bold" flexShrink={0}>
                {i + 1}
              </Circle>
              <Text color="fg.muted">{step}</Text>
            </HStack>
          ))}
        </Stack>
      </Stack>
    </Flex>
  );
}
