import {
  Field,
  Input,
  Select,
  Button,
  Stack,
  createListCollection,
} from "@chakra-ui/react";
import { FormEvent, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/Features/CreateFeatureModuleForm"
)({
  component: RouteComponent,
});

function RouteComponent() {
  const [name, setName] = useState("");
  const [type, setType] = useState("feature");
  const [description, setDescription] = useState("");

  // Dummy API handler for now
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const payload = {
      name,
      type,
      description,
    };

    console.log("Creating new feature/module:", payload);
    alert("Feature/module created (mock)");
  }

  const typeOptions = [
    { id: "feature", label: "Feature" },
    { id: "component", label: "Component" },
    { id: "module", label: "Module" },
  ];

  return (
    <div>
      <h2>Create Feature / Component / Module</h2>
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
          </Field.Root>

          <Field.Root>
            <Field.Label>Type</Field.Label>
            <Select.Root
              collection={createListCollection({ items: typeOptions })}
              onValueChange={(details) => setType(details.value[0])}
            >
              <Select.HiddenSelect />
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                  <Select.ClearTrigger />
                </Select.IndicatorGroup>
              </Select.Control>

              <Select.Positioner>
                <Select.Content>
                  {typeOptions.map((item) => (
                    <Select.Item key={item.id} item={item} />
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Select.Root>
          </Field.Root>

          <Field.Root>
            <Field.Label>Description (optional)</Field.Label>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description"
            />
          </Field.Root>

          <Button type="submit" colorScheme="blue">
            Create
          </Button>
        </Stack>
      </form>
    </div>
  );
}
