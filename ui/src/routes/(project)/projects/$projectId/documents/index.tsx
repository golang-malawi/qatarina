import { createFileRoute, Link } from "@tanstack/react-router";
import { Box, Button, Heading, Spinner, Text, Flex } from "@chakra-ui/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProjectDocuments, deleteProjectDocument } from "@/services/DocumentService";
import { List } from "@chakra-ui/react/list";
import { useTranslation } from "react-i18next";
import { toaster } from "@/components/ui/toaster";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/documents/"
)({
  component: DocumentsPage,
});

const getFileName = (path: string) => {
  if (!path) return "";
  return path.split("/").pop() || path;
};

function DocumentsPage() {
  const { t } = useTranslation();
  const { projectId } = Route.useParams();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["documents", projectId],
    queryFn: () => getProjectDocuments(projectId),
  });

  const deleteMutation = useMutation({
    mutationFn: (documentID: string) =>
      deleteProjectDocument({ projectID: projectId, documentID }),
    onSuccess: () => {
      toaster.create({
        title: t("documents.delete.success"),
        type: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["documents", projectId] });
    },
    onError: () => {
      toaster.create({
        title: t("documents.delete.error"),
        type: "error",
      });
    },
  });

  const responseData = data as { data?: { documents?: Array<any> } } | undefined;
  const documents = responseData?.data?.documents ?? [];

  if (isLoading) return <Spinner />;
  if (error) return <Text color="red.500">{t("documents.index.error")}</Text>;

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">{t("documents.index.title")}</Heading>
        <Link to="/projects/$projectId/documents/new" params={{ projectId }}>
          <Button colorScheme="blue" size="sm">
            + {t("documents.index.add_button")}
          </Button>
        </Link>
      </Flex>

      <List.Root gap={3}>
        {documents.length === 0 ? (
          <Text color="gray.500">{t("documents.index.empty")}</Text>
        ) : (
          documents.map((doc: any) => (
            <List.Item
              key={doc.id}
              border="1px solid #ccc"
              p={3}
              borderRadius="md"
            >
              <Flex justify="space-between" align="center">
                <Box>
                  <Text fontWeight="bold">{doc.name}</Text>
                  <Text fontSize="sm" color="blue.500">
                    {getFileName(doc.file_path)}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {t("documents.index.created_at")} {doc.created_at}
                  </Text>
                </Box>
                <Button
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                  onClick={() => deleteMutation.mutate(doc.id)}
                >
                  {t("documents.delete")}
                </Button>
              </Flex>
            </List.Item>
          ))
        )}
      </List.Root>
    </Box>
  );
}