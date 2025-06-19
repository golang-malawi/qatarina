import {
  Field,
  Input,
  Button,
  Stack,
  Heading,
} from "@chakra-ui/react";
import { FormEvent, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toaster } from "@/components/ui/toaster";
import ModuleService from "@/services/ModuleService";
import SelectFeatureModuleType from "@/components/SelectFeatureModuleType";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/Features/CreateFeatureModuleForm"
)({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const navigate = useNavigate();
  const moduleService = new ModuleService();

  const [name, setName] = useState("");
  const [type, setType] = useState("feature");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [priority, setPriority] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
  
    const payload = {
      name,
      type,
      description,
      code,
      priority: parseInt(priority),
      ProjectID: parseInt(params.projectId),
    };
  
    try {
      await moduleService.createModule(payload); 
  
      toaster.create({
        title: "Module created",
        description: `We've created ${type}: ${name}`,
        type: "success",
        duration: 3000,
      });
  
      // navigate({ to: `/projects/${params.projectId}` });
    } catch (err) {
      console.error(err);
      toaster.create({
        title: "Failed to create",
        description: "There was an error creating the module.",
        type: "error",
        duration: 3000,
      });
    }
  }
  
  return (
    <div>
      <Heading>Create Feature / Component / Module</Heading>
      <form onSubmit={handleSubmit}>
        <Stack gap={4} maxW="700px" mt={4}>
          <Field.Root>
            <Field.Label>Name</Field.Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Login Module"
            />
            <Field.HelperText>Feature/Module name</Field.HelperText>
          </Field.Root>

          <Field.Root>
            <SelectFeatureModuleType value={type} onChange={setType} />
          </Field.Root>

          <Field.Root>
            <Field.Label>Description (optional)</Field.Label>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description"
            />
            <Field.HelperText>Summary of the feature/module</Field.HelperText>
          </Field.Root>

          <Field.Root>
            <Field.Label>Code</Field.Label>
            <Input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g., AUTH01"
            />
            <Field.HelperText>Unique identifier code</Field.HelperText>
          </Field.Root>

          <Field.Root>
            <Field.Label>Priority</Field.Label>
            <Input
              type="number"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              placeholder="e.g., 1 for highest priority"
            />
            <Field.HelperText>Priority level (1 = high)</Field.HelperText>
          </Field.Root>

          <Button type="submit" colorScheme="blue">
            Create
          </Button>
        </Stack>
      </form>
    </div>
  );
}
