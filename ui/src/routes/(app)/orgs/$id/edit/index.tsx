import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { Box, Heading } from "@chakra-ui/react";
import { useState } from "react";
import { useGetOrgQuery, useUpdateOrgMutation } from "@/services/OrgsService";
import { toaster } from "@/components/ui/toaster";
import { DynamicForm } from "@/components/form/DynamicForm";
import { orgSchema } from "@/data/forms/org-schemas";
import { orgFields } from "@/data/forms/org-field-configs";

export const Route = createFileRoute("/(app)/orgs/$id/edit/")({
  component: EditOrgPage,
});

function EditOrgPage() {
  const { id } = useParams({ from: "/(app)/orgs/$id/edit/" });
  const { data: org, isLoading } = useGetOrgQuery(id);
  const updateOrgMutation = useUpdateOrgMutation();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  if (isLoading || !org) {
    return <Heading size="md">Loading organization details...</Heading>;
  }

  const defaultValues = {
    name: org.name ?? "",
    address: org.address ?? "",
    country: org.country ?? "",
    github_url: org.github_url ?? "",
    website_url: org.website_url ?? "",
  };

  const handleSubmit = async (values: {
    name: string;
    address?: string;
    country?: string;
    github_url?: string;
    website_url?: string;
  }) => {
    setSubmitting(true);
    try {
      const res = await updateOrgMutation.mutateAsync({
        orgID: id,
        data: { id: Number(id), ...values },
      });

      if (res) {
        toaster.create({
          title: "Organization updated.",
          description: "The organization has been successfully updated.",
          type: "success",
          duration: 3000,
        });
        navigate({ to: `/orgs/${id}` });
      }
    } catch {
      toaster.create({
        title: "Failed to update organization.",
        description: "An error occurred while updating the organization.",
        type: "error",
        duration: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Heading size="lg" mb={4}>
        Edit Organization
      </Heading>
      <DynamicForm
        fields={orgFields}
        schema={orgSchema}
        defaultValues={defaultValues}   
        onSubmit={handleSubmit}
        submitText="Update Organization"
        submitLoading={submitting}
        layout="vertical"
        spacing={4}
      />
    </Box>
  );
}