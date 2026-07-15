import { Box, Heading } from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/workspace/testers/invite")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();

  return (
    <Box p={6}>
      <Heading size="lg" color="fg.heading">
        {t("testers.invite.title")}
      </Heading>
      {/* Expand this page later with a form or instructions */}
    </Box>
  );
}
