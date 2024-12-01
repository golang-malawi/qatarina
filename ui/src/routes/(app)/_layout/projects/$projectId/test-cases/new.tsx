import { Button, Input } from "@chakra-ui/react";
import { FormEvent, useState } from "react";
import SelectTestKind from "@/components/SelectTestKind";
import TestCaseService from "@/services/TestCaseService";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toaster } from "@/components/ui/toaster";
import { Field } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute(
  "/(app)/_layout/projects/$projectId/test-cases/new"
)({
  component: NewTestCases,
});

function NewTestCases() {
  const testCaseService = new TestCaseService();
  const project_id = Route.useParams().projectId;
  const redirect = useNavigate();
  const [kind, setKind] = useState("");
  const [code, setCode] = useState("");
  const [feature_or_module, setFeature_or_module] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [is_draft, setIs_draft] = useState(false);
  const [tags, setTags] = useState<string[]>([]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const res = await testCaseService.create({
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

        <Field label="Title" helperText="Test Case Title">
          <Input
            type="text"
            name="title"
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>

        <Field label="Code" helperText="Test Case Code.">
          <Input
            type="text"
            name="code"
            onChange={(e) => setCode(e.target.value)}
          />
        </Field>

        <Field
          label="Feature, Component or Module"
          helperText="Test Case Feature or Module."
        >
          <Input
            type="text"
            name="code"
            onChange={(e) => setFeature_or_module(e.target.value)}
          />
        </Field>

        <Field label="Test Kind" helperText="Test Kind.">
          <SelectTestKind onChange={(e) => setKind(e)} />
        </Field>

        <Field label="Description" helperText="Test Case Description.">
          <Input
            type="text"
            name="description"
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        <Field label="Tags" helperText="Test Case tags, separated by comma.">
          <Input
            type="text"
            name="description"
            onChange={(e) => setTags(e.target.value.split(","))}
          />
        </Field>

        <Checkbox
          onCheckedChange={(e) =>
            setIs_draft(e.checked == "indeterminate" ? false : e.checked)
          }
        >
          Is Draft
        </Checkbox>

        <Button type="submit">Create Test Case</Button>
      </form>
    </div>
  );
}
