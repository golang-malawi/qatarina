import { Alert, Card, Flex, Heading, Spinner, Stack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

type BaseStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

type LoadingStateProps = {
  label?: string;
  minH?: string | number;
};

export function LoadingState({ label = "Loading...", minH = "40" }: LoadingStateProps) {
  return (
    <Flex justify="center" align="center" minH={minH}>
      <Stack align="center" gap={3}>
        <Spinner size="xl" color="brand.solid" />
        <Text color="fg.subtle">{label}</Text>
      </Stack>
    </Flex>
  );
}

export function EmptyState({ title, description, action }: BaseStateProps) {
  return (
    <Card.Root border="sm" borderColor="border.subtle" bg="bg.surface">
      <Card.Body p={{ base: 6, md: 8 }}>
        <Stack align="center" textAlign="center" gap={3}>
          <Heading size="md" color="fg.heading">
            {title}
          </Heading>
          {description && <Text color="fg.subtle">{description}</Text>}
          {action}
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "Please try again.",
  action,
}: BaseStateProps) {
  return (
    <Card.Root border="sm" borderColor="border.subtle" bg="bg.surface">
      <Card.Body p={{ base: 6, md: 8 }}>
        <Stack gap={4}>
          <Alert.Root colorPalette="danger" variant="outline">
            <Alert.Content>
              <Alert.Title>{title}</Alert.Title>
              <Alert.Description>{description}</Alert.Description>
            </Alert.Content>
          </Alert.Root>
          {action}
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
