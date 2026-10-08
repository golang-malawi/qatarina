import { Badge } from "@chakra-ui/react";
import { normalizePriority, PRIORITY_COLORS } from "@/common/constants/priority";

interface PriorityBadgeProps {
  value?: string | null;
  // Optional prefix e.g. "Urgency" to distinguish plan urgency from test case priority
  label?: string;
}

export function PriorityBadge({ value, label }: PriorityBadgeProps) {
  const level = normalizePriority(value);
  return (
    <Badge colorPalette={PRIORITY_COLORS[level]} variant="subtle" textTransform="capitalize">
      {label ? `${label}: ${level}` : level}
    </Badge>
  );
}
