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

export const Route = createFileRoute("/(app)/orgs/$id/")({
  component: OrgDetailPage,
});

function OrgDetailPage() {
  const { id } = useParams({ from: "/(app)/orgs/$id/" });
  const { data, isLoading } = useGetOrgQuery(id);

  if (isLoading) return <Spinner />;

  const org = data;

  const DetailField = ({ label, value }: { label: string; value?: string | number }) => (
    <Box>
      <Text fontSize="sm" fontWeight="semibold" color="gray.600">{label}</Text>
      <Text fontSize="md" mt={1}>{value || "N/A"}</Text>
    </Box>
  );

  return (
    <Box p={6}>
      <Heading size="xl" mb={2}>{org?.name}</Heading>
      <Badge colorScheme="blue" mb={6}>ID: {org?.id}</Badge>
      <Box borderTop="1px solid" borderColor="gray.200" my={6} />

      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={8}>
        <DetailField label="Address" value={org?.address} />
        <DetailField label="Country" value={org?.country} />
        <DetailField label="Website URL" value={org?.website_url} />
        <DetailField label="GitHub URL" value={org?.github_url} />
        <DetailField label="Created By (User ID)" value={org?.created_by} />
        <DetailField label="Created At" value={org?.created_at} />
        <DetailField label="Updated At" value={org?.updated_at} />
      </Grid>
    </Box>
  );
}