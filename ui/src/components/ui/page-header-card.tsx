import { Card, Flex, Heading, HStack, Icon, Stack, Text } from "@chakra-ui/react";
import type { ElementType, ReactNode } from "react";

type PageHeaderCardProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: ElementType;
  badges?: ReactNode;
  actions?: ReactNode;
};

export function PageHeaderCard({
  title,
  description,
  icon,
  badges,
  actions,
}: PageHeaderCardProps) {
  return (
    <Card.Root border="sm" borderColor="border.subtle" bg="bg.surface" shadow="sm" mb={6}>
      <Card.Body p={{ base: 4, md: 6 }}>
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align={{ base: "start", md: "center" }}
          gap={4}
        >
          <Stack gap={1}>
            <HStack gap={2}>
              {icon ? <Icon as={icon} color="brand.solid" /> : null}
              <Heading color="fg.heading">{title}</Heading>
            </HStack>
            {description ? <Text color="fg.subtle">{description}</Text> : null}
            {badges ? <HStack gap={2}>{badges}</HStack> : null}
          </Stack>
          {actions}
        </Flex>
      </Card.Body>
    </Card.Root>
  );
}
