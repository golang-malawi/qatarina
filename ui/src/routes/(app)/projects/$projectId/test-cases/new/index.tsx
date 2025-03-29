import {
  Button,
  Checkbox,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  useToast,
} from "@chakra-ui/react";
import { FormEvent, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import SelectTestKind from "@/components/SelectTestKind";
import { createFileRoute } from "@tanstack/react-router";
import { createTestCase } from "@/services/TestCaseService";

export const Route = createFileRoute(
  "/(app)/projects/$projectId/test-cases/new/"
)({
  component: NewTestCases,
});

function NewTestCases() {
  const toast = useToast();
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
      toast({
        title: "Test Case created.",
        description: "We've created your Test Case.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      redirect({ to: "/projects" });
    }

    return false;
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <h3>Create Test Cases</h3>

        <FormControl>
          <FormLabel>Title</FormLabel>
          <Input
            type="text"
            name="title"
            onChange={(e) => setTitle(e.target.value)}
          />
          <FormHelperText>Test Case Title.</FormHelperText>
        </FormControl>

        <FormControl>
          <FormLabel>Code</FormLabel>
          <Input
            type="text"
            name="code"
            onChange={(e) => setCode(e.target.value)}
          />
          <FormHelperText>Test Case Code.</FormHelperText>
        </FormControl>

        <FormControl>
          <FormLabel>Feature, Component or Module</FormLabel>
          <Input
            type="text"
            name="code"
            onChange={(e) => setFeature_or_module(e.target.value)}
          />
          <FormHelperText>Test Case Feature or Module.</FormHelperText>
        </FormControl>

        <FormControl>
          <FormLabel>Test Kind</FormLabel>
          <SelectTestKind onChange={(e) => setKind(e.target.value)} />
          <FormHelperText>Test Kind.</FormHelperText>
        </FormControl>

        <FormControl>
          <FormLabel>Description</FormLabel>
          <Input
            type="text"
            name="description"
            onChange={(e) => setDescription(e.target.value)}
          />
          <FormHelperText>Test Case Description.</FormHelperText>
        </FormControl>

        <FormControl>
          <FormLabel>Tags</FormLabel>
          <Input
            type="text"
            name="description"
            onChange={(e) => setTags(e.target.value.split(","))}
          />
          <FormHelperText>Test Case tags, separated by comma.</FormHelperText>
        </FormControl>

        <Checkbox onChange={(e) => setIs_draft(e.target.checked)}>
          Is Draft
        </Checkbox>

        <Button type="submit">Create Test Case</Button>
      </form>
    </div>
  );
}
