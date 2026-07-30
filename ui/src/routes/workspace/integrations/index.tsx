import { Box, Heading } from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/workspace/integrations/")({
  component: ListIntegrations,
});

function ListIntegrations() {
  const { t } = useTranslation();

  return (
    <Box>
      <Heading>{t("integrations.title")}</Heading>
    </Box>
  );
}
