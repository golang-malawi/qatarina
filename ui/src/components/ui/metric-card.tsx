import { Box, Card, Heading, HStack, Icon, Stack, Text } from "@chakra-ui/react";
import { IconArrowDownRight, IconArrowUpRight, IconMinus } from "@tabler/icons-react";
import type { ElementType, ReactNode } from "react";

type MetricCardProps = {
  label: ReactNode;
  value: ReactNode;
  helperText?: ReactNode;
  icon?: ElementType;
  tone?: "neutral" | "success" | "danger" | "warning" | "info" | "brand";
  variant?: "default" | "subtle" | "emphasis";
  trend?: {
    value: ReactNode;
    direction?: "up" | "down" | "flat";
  };
};

const toneColorMap: Record<
  NonNullable<MetricCardProps["tone"]>,
  { accent: string; iconBg: string; iconColor: string; trendColor: string }
> = {
  neutral: {
    accent: "gray.400",
    iconBg: "bg.subtle",
    iconColor: "fg.subtle",
    trendColor: "fg.subtle",
  },
  success: {
    accent: "green.500",
    iconBg: "green.50",
    iconColor: "green.700",
    trendColor: "green.600",
  },
  danger: {
    accent: "red.500",
    iconBg: "red.50",
    iconColor: "red.700",
    trendColor: "red.600",
  },
  warning: {
    accent: "orange.500",
    iconBg: "orange.50",
    iconColor: "orange.700",
    trendColor: "orange.600",
  },
  info: {
    accent: "blue.500",
    iconBg: "blue.50",
    iconColor: "blue.700",
    trendColor: "blue.600",
  },
  brand: {
    accent: "brand.solid",
    iconBg: "brand.subtle",
    iconColor: "brand.fg",
    trendColor: "brand.fg",
  },
};

export function MetricCard({
  label,
  value,
  helperText,
  icon,
  tone = "neutral",
  variant = "default",
  trend,
}: MetricCardProps) {
  const toneStyles = toneColorMap[tone];
  const background = variant === "subtle" ? "bg.subtle" : "bg.surface";
  const showAccent = variant === "emphasis";

  const trendDirection = trend?.direction ?? "flat";
  const trendIcon =
    trendDirection === "up"
      ? IconArrowUpRight
      : trendDirection === "down"
        ? IconArrowDownRight
        : IconMinus;
  const trendColor =
    trendDirection === "flat" ? "fg.subtle" : toneStyles.trendColor;

  return (
    <Card.Root
      border="sm"
      borderColor="border.subtle"
      bg={background}
      position="relative"
      overflow="hidden"
      shadow={variant === "emphasis" ? "sm" : "none"}
    >
      {showAccent ? (
        <Box
          position="absolute"
          top="0"
          bottom="0"
          left="0"
          w="1"
          bg={toneStyles.accent}
        />
      ) : null}
      <Card.Body p={4} pl={showAccent ? 5 : 4}>
        <Stack gap={2}>
          <HStack justify="space-between" align="start">
            <Stack gap={1}>
              <Text fontSize="xs" color="fg.subtle">
                {label}
              </Text>
              <Heading size="lg" color="fg.heading">
                {value}
              </Heading>
            </Stack>
            {icon ? (
              <Box
                p={2}
                borderRadius="md"
                bg={toneStyles.iconBg}
                color={toneStyles.iconColor}
              >
                <Icon as={icon} fontSize="16" />
              </Box>
            ) : null}
          </HStack>

          {helperText ? (
            <Text fontSize="sm" color="fg.subtle">
              {helperText}
            </Text>
          ) : null}

          {trend ? (
            <HStack gap={1} color={trendColor}>
              <Icon as={trendIcon} boxSize="3.5" />
              <Text fontSize="xs" fontWeight="medium">
                {trend.value}
              </Text>
            </HStack>
          ) : null}
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
