import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Box, Heading, Input, Field as ChakraField, Button } from "@chakra-ui/react";
import { useState } from "react";
import { useCreateProjectDocumentMutation } from "@/services/DocumentService";
import { toaster } from "@/components/ui/toaster";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/documents/new/"
)({
  component: CreateDocumentPage,
});

function CreateDocumentPage() {
  const { t } = useTranslation();
  const { projectId } = Route.useParams();
  const numericProjectId = Number(projectId);
  const navigate = useNavigate();
  const mutation = useCreateProjectDocumentMutation();

  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toaster.create({ title: "Please select a file to upload", type: "error" });
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("name", name || file.name);
      formData.append("file", file); 

      const res = await mutation.mutateAsync({
        params: { path: { projectID: numericProjectId } },
        body: formData as any,
      });

      if (res) {
        toaster.create({
          title: t("documents.new.success"),
          type: "success",
        });
        navigate({
          to: "/projects/$projectId/documents",
          params: { projectId },
        });
      }
    } catch {
      toaster.create({
        title: t("documents.new.error"),
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box maxW="lg" mx="auto" p={4}>
      <Heading size="lg" mb={4}>
        {t("documents.new.title")}
      </Heading>
      
      <form onSubmit={handleSubmit}>
        <Box mb={4}>
          <ChakraField.Root>
            <ChakraField.Label>Document Name (Optional)</ChakraField.Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Leave blank to use file name"
            />
          </ChakraField.Root>
        </Box>

        <Box mb={6}>
          <ChakraField.Root required>
            <ChakraField.Label>Upload File</ChakraField.Label>
            <Input
              type="file"
              p={1}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.md,.txt"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFile(e.target.files[0]);
                }
              }}
            />
          </ChakraField.Root>
        </Box>

        <Button type="submit" colorScheme="blue" loading={isSubmitting} width="full">
          {t("documents.new.submit")}
        </Button>
      </form>
    </Box>
  );
}