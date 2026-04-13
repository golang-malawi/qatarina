import { Card } from "@chakra-ui/react";
import type { ReactNode } from "react";

type PageToolbarCardProps = {
  children: ReactNode;
};

export function PageToolbarCard({ children }: PageToolbarCardProps) {
  return (
    <Card.Root border="sm" borderColor="border.subtle" bg="bg.surface" mb={6}>
      <Card.Body p={{ base: 4, md: 5 }}>{children}</Card.Body>
    </Card.Root>
  );
}
