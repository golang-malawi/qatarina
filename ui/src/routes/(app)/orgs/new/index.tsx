import { createFileRoute } from "@tanstack/react-router";
import { Box, Heading } from "@chakra-ui/react";
import { useNavigate } from "@tanstack/react-router";
import { useCreateOrgMutation } from "@/services/OrgsService";
import { toaster } from "@/components/ui/toaster";
import { useState } from "react";
import { DynamicForm } from "@/components/form/DynamicForm";
import { orgSchema } from "@/data/forms/org-schemas";
import { orgFields } from "@/data/forms/org-field-configs";

export const Route = createFileRoute("/(app)/orgs/new/")({
  component: CreateNewOrg,
});

function CreateNewOrg() {
  const createOrgMutation = useCreateOrgMutation();
  const redirect = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: {
    name: string;
    country?: string;
    github_url?: string;
    website_url?: string;
  }) => {
    setSubmitting(true);
    try {
      const res = await createOrgMutation.mutateAsync({
        body: values,
      });
      
      if (res) {
        toaster.create({
          title: "Organization created.",
          description: "We've created your new organization.",
          type: "success",
          duration: 3000,
        });
        redirect({ to: "/orgs" });
      }
    } catch {
      toaster.create({
        title: "Failed to create organization.",
        description: "Failed to create new organization",
        type: "error",
        duration: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Box>
      <Heading size="3xl"> Add New Organization</Heading>
      <DynamicForm
        schema={orgSchema}
        fields={orgFields}
        onSubmit={handleSubmit}
        submitText="Create Organization"
        submitLoading={submitting}
        layout="vertical"
        spacing={4}
      />
    </Box>
    );
}