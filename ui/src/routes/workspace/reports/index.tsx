import { Box, Heading } from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/workspace/reports/")({
  component: ListReports,
});

function ListReports() {
  const { t } = useTranslation();

  return (
    <Box>
      <Heading>{t("reports")}</Heading>
    </Box>
  );
}
