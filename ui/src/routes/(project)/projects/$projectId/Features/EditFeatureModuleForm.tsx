import { Field, Input, Button, Stack, Spinner } from "@chakra-ui/react";
import { useEffect, useState, FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toaster } from "@/components/ui/toaster";
import ModuleService from "@/services/ModuleService";
import SelectFeatureModuleType from "@/components/SelectFeatureModuleType";
import { Heading } from "@chakra-ui/react";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/Features/EditFeatureModuleForm",
)({
  component: EditFeatureModuleForm,
  validateSearch: (search) => {
    if (!search.moduleId) throw new Error("Missing moduleId");
    return {
      moduleId: String(search.moduleId),
    };
  },
});

function EditFeatureModuleForm() {
  const { projectId } = Route.useParams();
  const { moduleId } = Route.useSearch();
  const navigate = useNavigate();
  const moduleService = new ModuleService();
  console.log("moduleId from search params:", moduleId);
  const [name, setName] = useState("");
  const [type, setType] = useState("feature");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [priority, setPriority] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModule = async () => {
      if (!moduleId) {
        toaster.create({
          title: "Invalid module ID",
          description: "Module ID is missing or invalid.",
          type: "error",
        });
        return;
      }

      try {
        const data = await moduleService.getModuleById(moduleId);
        setName(data.name || "");
        setType(data.type || "");
        setDescription(data.description || "");
        setCode(data.code || "");
        setPriority(data.priority?.toString() || "");
      } catch (err) {
        console.error(err);
        toaster.create({
          title: "Failed to load module",
          description: "Unable to fetch module details.",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchModule();
  }, [moduleId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const payload = {
      ID: parseInt(moduleId),
      name,
      type,
      description,
      code,
      priority: parseInt(priority),
      ProjectID: parseInt(projectId),
    };

    try {
      await moduleService.updateModule(moduleId, payload);

      toaster.create({
        title: "Module updated",
        description: `Successfully updated ${type}: ${name}`,
        type: "success",
        duration: 3000,
      });

      navigate({ to: `/projects/${projectId}/Features/` });
    } catch (err) {
      console.error(err);
      toaster.create({
        title: "Failed to update",
        description: "An error occurred while updating the module.",
        type: "error",
        duration: 3000,
      });
    }
  }

  if (loading)
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <Spinner size="xl" />
        <p>Loading module details...</p>
      </div>
    );

  return (
    <div>
      <Heading>Edit Feature / Component / Module</Heading>
      <form onSubmit={handleSubmit}>
        <Stack gap={4} maxW="700px" mt={4}>
          <Field.Root>
            <Field.Label>Name</Field.Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Login Module"
              required
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
              required
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
              required
            />
            <Field.HelperText>Priority level (1 = high)</Field.HelperText>
          </Field.Root>

          <Button type="submit" colorScheme="teal">
            Save Changes
          </Button>
        </Stack>
      </form>
    </div>
  );
}
