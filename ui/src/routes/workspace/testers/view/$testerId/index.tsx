import { Box, Heading, Text, Spinner, Stack } from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";
import { useTesterQuery } from "@/services/TesterService";
import ErrorAlert from "@/components/ui/error-alert";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/workspace/testers/view/$testerId/")({
  component: ViewTesterPage,
});

function ViewTesterPage() {
  const { t } = useTranslation();
  const { testerId } = Route.useParams();
  const { data, isPending, isError, error } = useTesterQuery(testerId);

  if (isPending) {
    return (
      <Box p={6}>
        <Spinner size="lg" color="brand.solid" />
      </Box>
    );
  }

  if (isError) {
    return (
      <ErrorAlert
        message={`${t("testers.error.load_single")}: ${error?.detail ?? error?.title ?? t("common.unknown_error")}`}
      />
    );
  }

  const tester: any = data;

  return (
    <Box p={6}>
      <Heading size="lg" mb={4} color="fg.heading">
        {t("testers.view.title")}
      </Heading>

      <Stack gap={4} color="fg.muted">
        <Text>
          <strong>{t("testers.view.user_id")}:</strong> {tester.user_id}
        </Text>
        <Text>
          <strong>{t("testers.view.name")}:</strong> {tester.name}
        </Text>
        <Text>
          <strong>{t("testers.view.email")}:</strong> {tester.email}
        </Text>
        <Text>
          <strong>{t("testers.view.project")}:</strong> {tester.project}
        </Text>
        <Text>
          <strong>{t("testers.view.role")}:</strong> {tester.role}
        </Text>
        <Text>
          <strong>{t("testers.view.last_login")}:</strong> {tester.last_login_at}
        </Text>
        <Text>
          <strong>{t("testers.view.created_at")}:</strong> {tester.created_at}
        </Text>
        <Text>
          <strong>{t("testers.view.updated_at")}:</strong> {tester.updated_at}
        </Text>
      </Stack>

      <Box borderTop="sm" borderColor="border.subtle" mt={6} />
    </Box>
  );
}
