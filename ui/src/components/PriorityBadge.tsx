import { Badge } from "@chakra-ui/react";
import { normalizePriority, PRIORITY_STYLES } from "@/common/constants/priority";

interface PriorityBadgeProps {
  value?: string | null;
  // Optional prefix e.g. "Urgency" to distinguish plan urgency from test case priority
  label?: string;
}

export function PriorityBadge({ value, label }: PriorityBadgeProps) {
  const level = normalizePriority(value);
  return (
    <Badge
      colorPalette={PRIORITY_STYLES[level].colorPalette}
      variant={PRIORITY_STYLES[level].variant}
      textTransform="capitalize"
    >
      {label ? `${label}: ${level}` : level}
    </Badge>
  );
}
