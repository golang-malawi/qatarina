import { createFileRoute } from "@tanstack/react-router";
import { Box, Button, Heading, Textarea, Text, Stack, Spinner } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useProjectTestCaseTemplateQuery, useAddProjectTestCaseTemplateMutation } from "@/services/ProjectService";

function TestCaseTemplatePage() {
  const navigate = useNavigate();
  const { projectId } = useParams({ from: "/(project)/projects/$projectId/settings/TestCaseTemplate" });
  const queryClient = useQueryClient();

  const projectID = Number(projectId);

  const { data, isLoading } = useProjectTestCaseTemplateQuery(projectID);
  const saveMutation = useAddProjectTestCaseTemplateMutation();

  const [template, setTemplate] = useState("");

  // Prefill textarea when data arrives
  useEffect(() => {
    if (data) {
      setTemplate(data.test_case_template ?? "");
    }
  }, [data]);

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync({
        params: { path: { projectID } },
        body: {
          project_id: projectID,
          test_case_template: template,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["projectTemplate", projectID] });
      navigate({ to: `/projects/${projectId}/settings` });
    } catch (err: any) {
      console.error("Failed to save template", err);
    }
  };

  const handleCancel = () => {
    navigate({ to: `/projects/${projectId}/settings` });
  };

  if (isLoading) {
    return (
      <Box p={10}>
        <Spinner size="lg" />
        <Text mt={4}>Loading template...</Text>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Heading size="lg" mb={8}>
        {data?.test_case_template ? "Edit Test Case Template" : "Add Test Case Template"}
      </Heading>
      <Stack gap={6}>
        <Textarea
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          placeholder="Enter template (e.g. Preconditions, Steps, Expected Result)"
          rows={16}
          width="100%"
        />
        <Box>
          <Button
            type="button"
            colorScheme="blue"
            mr={4}
            onClick={handleSave}
            loading={saveMutation.isPending}
          >
            Save
          </Button>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </Box>
        <Text color="gray.500">
          This template will be used as a guide for users when creating test cases.
        </Text>
      </Stack>
    </Box>
  );
}

export const Route = createFileRoute("/(project)/projects/$projectId/settings/TestCaseTemplate")({
  component: TestCaseTemplatePage,
});
