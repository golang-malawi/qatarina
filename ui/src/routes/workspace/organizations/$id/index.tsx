import { createFileRoute } from '@tanstack/react-router';
import {
  Box,
  Heading,
  Spinner,
  Text,
  Grid,
  Badge,
} from "@chakra-ui/react";
import { useParams } from '@tanstack/react-router';
import { useGetOrgQuery } from "@/services/OrgsService";
import { useGetUserQuery } from '@/services/UserService';
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import { useTranslation } from "react-i18next";

countries.registerLocale(enLocale);

export const Route = createFileRoute("/workspace/organizations/$id/")({
  component: OrgDetailPage,
});

function OrgDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams({ from: "/workspace/organizations/$id/" });
  const { data: org, isLoading } = useGetOrgQuery(id);

  const userId = org?.created_by ? String(org.created_by) : undefined;
  const { data: creator } = useGetUserQuery(userId, { enabled: !!userId });

  if (isLoading) return <Spinner />;

  const DetailField = ({ label, value }: { label: string; value?: string | number }) => (
    <Box>
      <Text fontSize="sm" fontWeight="semibold" color="gray.600">{label}</Text>
      <Text fontSize="md" mt={1}>{value || t("common.not_available")}</Text>
    </Box>
  );

  return (
    <Box p={6}>
      <Heading size="xl" mb={2}>{org?.name}</Heading>
      <Badge colorScheme="blue" mb={6}>
        {t("organizations.detail.id", { id: org?.id })}
      </Badge>

      <Box borderTop="1px solid" borderColor="gray.200" my={6} />

      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={8}>
        <DetailField label={t("organizations.detail.address")} value={org?.address} />
        <DetailField
          label={t("organizations.detail.country")}
          value={org?.country ? countries.getName(org.country, "en") || org.country : t("common.not_available")}
        />
        <DetailField label={t("organizations.detail.website")} value={org?.website_url} />
        <DetailField label={t("organizations.detail.github")} value={org?.github_url} />
        <DetailField
          label={t("organizations.detail.created_by")}
          value={creator?.display_name ?? org?.created_by}
        />
        <DetailField label={t("organizations.detail.created_at")} value={org?.created_at} />
        <DetailField label={t("organizations.detail.updated_at")} value={org?.updated_at} />
      </Grid>
    </Box>
  );
}
