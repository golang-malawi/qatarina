import { Button, Checkbox, Field, Input, Spinner } from "@chakra-ui/react";
import { FormEvent, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import SelectTestKind from "@/components/SelectTestKind";
import { createFileRoute } from "@tanstack/react-router";
import { useCreateTestCaseMutation } from "@/services/TestCaseService";
import { toaster } from "@/components/ui/toaster";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-cases/new/"
)({
  component: NewTestCases,
});

function NewTestCases() {
  const params = Route.useParams();
  const redirect = useNavigate();
  const project_id = params.projectId;
  const [kind, setKind] = useState("");
  const [code, setCode] = useState("");
  const [feature_or_module, setFeature_or_module] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [is_draft, setIs_draft] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const createTestCaseMutation = useCreateTestCaseMutation();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const res = await createTestCaseMutation.mutateAsync({
      body: {
        project_id: parseInt(`${project_id}`),
        kind,
        code,
        feature_or_module,
        title,
        description,
        is_draft,
        tags: tags,
      },
    });

    if (res) {
      toaster.create({
        title: "Test Case created.",
        description: "We've created your Test Case.",
        type: "success",
        duration: 3000,
      });
      redirect({ to: "/projects" });
    }

    return false;
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <h3>Create Test Cases</h3>

        <Field.Root>
          <Field.Label>Title</Field.Label>
          <Input
            type="text"
            name="title"
            onChange={(e) => setTitle(e.target.value)}
          />
          <Field.HelperText>Test Case Title.</Field.HelperText>
        </Field.Root>

        <Field.Root>
          <Field.Label>Code</Field.Label>
          <Input
            type="text"
            name="code"
            onChange={(e) => setCode(e.target.value)}
          />
          <Field.HelperText>Test Case Code.</Field.HelperText>
        </Field.Root>

        <Field.Root>
          <Field.Label>Feature, Component or Module</Field.Label>
          <Input
            type="text"
            name="code"
            onChange={(e) => setFeature_or_module(e.target.value)}
          />
          <Field.HelperText>Test Case Feature or Module.</Field.HelperText>
        </Field.Root>

        <Field.Root>
          <Field.Label>Test Kind</Field.Label>
          <SelectTestKind onChange={setKind} />
          <Field.HelperText>Test Kind.</Field.HelperText>
        </Field.Root>

        <Field.Root>
          <Field.Label>Description</Field.Label>
          <Input
            type="text"
            name="description"
            onChange={(e) => setDescription(e.target.value)}
          />
          <Field.HelperText>Test Case Description.</Field.HelperText>
        </Field.Root>

        <Field.Root>
          <Field.Label>Tags</Field.Label>
          <Input
            type="text"
            name="description"
            onChange={(e) => setTags(e.target.value.split(","))}
          />
          <Field.HelperText>
            Test Case tags, separated by comma.
          </Field.HelperText>
        </Field.Root>

        <Checkbox.Root
          checked={is_draft}
          onCheckedChange={(e) => setIs_draft(!!e.checked)}
        >
          Is Draft
        </Checkbox.Root>

        <Button type="submit" disabled={createTestCaseMutation.isPending}>
          {createTestCaseMutation.isPending ? (
            <Spinner size="sm" mr={2} />
          ) : null}
          {createTestCaseMutation.isPending
            ? "Creating..."
            : "Create Test Case"}
        </Button>
      </form>
    </div>
  );
}
