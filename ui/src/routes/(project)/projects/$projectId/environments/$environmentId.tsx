import { createFileRoute } from "@tanstack/react-router";
import { Box, Heading, Spinner, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { getEnvironment } from "@/services/EnvironmentService";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/environments/$environmentId"
)({
  component: EnvironmentDetailPage,
});

function EnvironmentDetailPage() {
  const { t } = useTranslation();
  const { environmentId } = Route.useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["environment", environmentId],
    queryFn: () => getEnvironment(environmentId),
  });

  if (isLoading) return <Spinner />;
  if (error)
    return (
      <Text color="red.500">{t("environments.detail.error")}</Text>
    );

  const env = data?.data;

  return (
    <Box>
      <Heading size="lg" mb={4}>
        {t("environments.detail.title")}
      </Heading>

      <Text fontWeight="bold">{t("environments.detail.name")}</Text>
      <Text mb={2}>{env?.name}</Text>

      <Text fontWeight="bold">{t("environments.detail.description")}</Text>
      <Text mb={2}>
        {env?.description && env.description.trim().length > 0
          ? env.description
          : t("environments.detail.no_description")}
      </Text>

      <Text fontWeight="bold">{t("environments.detail.base_url")}</Text>
      <Text mb={2} color="blue.500">
        {env?.base_url && env.base_url.trim().length > 0
          ? env.base_url
          : t("environments.detail.no_base_url")}
      </Text>

      <Text fontSize="sm" color="gray.500">
        {t("environments.detail.created_at")} {env?.created_at}
      </Text>
      <Text fontSize="sm" color="gray.500">
        {t("environments.detail.updated_at")} {env?.updated_at}
      </Text>
    </Box>
  );
}
