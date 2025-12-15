import { createFileRoute} from "@tanstack/react-router";
import {
  Tabs
} from "@chakra-ui/react";

import { useTestCaseQuery } from "@/services/TestCaseService";


export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-cases/$testCaseId/"
)({
  component: ViewTestCase,
});

function ViewTestCase() {
  const { projectId, testCaseId } = Route.useParams();
  const { data, isLoading, error } = useTestCaseQuery(testCaseId);


  if (isLoading) return <div>Loading test case...</div>;
  if (error) return <div>Error loading test case</div>;

  const testCase = data?.test_case;
  if (!testCase) return <div>No data found</div>;

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">{testCase.title}</h1>
        <p className="text-sm text-muted">
          Code: {testCase.code} • Feature: {testCase.feature_or_module}
        </p>
        <p className="text-sm text-muted">Project ID: {projectId}</p>
      </div>

      {/* Tabs */}
      <Tabs.Root defaultValue="description">
        <Tabs.List>
          <Tabs.Trigger value="description">Description</Tabs.Trigger>
          <Tabs.Trigger value="metadata">Metadata</Tabs.Trigger>
          <Tabs.Trigger value="tags">Tags</Tabs.Trigger>
          <Tabs.Trigger value="documents">Documents</Tabs.Trigger>
        </Tabs.List>

        {/* DESCRIPTION */}
        <Tabs.Content value="description" title="Description">
          <p className="m-0">{testCase.description || "No description"}</p>
        </Tabs.Content>

        {/* METADATA */}
        <Tabs.Content value="metadata" title="Metadata">
          <div className="space-y-2 text-sm">
            <p><strong>Type:</strong> {testCase.kind}</p>
            <p><strong>Created By:</strong> User ID {testCase.created_by}</p>
            <p><strong>Status:</strong> {testCase.is_draft ? "Draft" : "Published"}</p>
            <p><strong>Created At:</strong> {new Date(testCase.created_at).toLocaleString()}</p>
            <p><strong>Updated At:</strong> {new Date(testCase.updated_at).toLocaleString()}</p>
          </div>
        </Tabs.Content>

        {/* TAGS */}
        <Tabs.Content value="tags" title="Tags">
          {testCase.tags && testCase.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {testCase.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded bg-gray-200 text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p>No tags</p>
          )}
        </Tabs.Content>

        {/* DOCUMENTS – placeholder for future API */}
        <Tabs.Content value="documents" title="Documents and Media">
          <p>No documents uploaded yet.</p>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}