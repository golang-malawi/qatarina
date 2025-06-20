import { Button, Checkbox, Field, Input } from "@chakra-ui/react";
import { FormEvent, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import SelectTestKind from "@/components/SelectTestKind";
import SelectFeatureModule from "@/components/SelectFeatureModule";
import { createFileRoute } from "@tanstack/react-router";
import { createTestCase } from "@/services/TestCaseService";
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const res = await createTestCase({
      project_id: parseInt(`${project_id}`),
      kind,
      code,
      feature_or_module,
      title,
      description,
      is_draft,
      tags: tags,
    });

    if (res.status == 200) {
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
          <SelectFeatureModule onChange={setFeature_or_module} />
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

        <Button marginTop={10} width={"100%"} type="submit">Create Test Case</Button>
      </form>
    </div>
  );
}
