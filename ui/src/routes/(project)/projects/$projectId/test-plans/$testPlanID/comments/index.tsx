import { createFileRoute } from "@tanstack/react-router";
import { Box, Button, Flex, Input, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext"; 
import {
  useTestPlanCommentsQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useConvertCommentMutation,
} from "@/services/TestPlanService";
import { toaster } from "@/components/ui/toaster";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-plans/$testPlanID/comments/"
)({
  component: TestPlanComments,
});

function TestPlanComments() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { testPlanID } = Route.useParams();

  const numericTestPlanId = Number(testPlanID);
  const { data, refetch } = useTestPlanCommentsQuery(numericTestPlanId);

  const createMutation = useCreateCommentMutation();
  const deleteMutation = useDeleteCommentMutation();
  const convertMutation = useConvertCommentMutation();

  const [newComment, setNewComment] = useState("");

  const handleAdd = async () => {
    if (!newComment.trim() || !user?.id) return;
    try {
      await createMutation.mutateAsync({
        params: { path: { testPlanID: numericTestPlanId } },
        body: { user_id: user.id, content: newComment },
      });
      setNewComment("");
      toaster.success({ title: t("comments.addSuccess", "Comment added") });
      await refetch();
    } catch (err: any) {
      toaster.error({
        title: t("comments.addError", "Failed to add comment"),
        description: err?.message || t("common.unexpectedError", "An unexpected error occurred"),
      });
    }
  };

  const handleDelete = async (commentId: number) => {
    try {
      await deleteMutation.mutateAsync({
        params: { path: { testPlanID: numericTestPlanId, commentID: commentId } },
      });
      toaster.success({ title: t("comments.deleteSuccess", "Comment deleted") });
      await refetch();
    } catch (err: any) {
      toaster.error({
        title: t("comments.deleteError", "Failed to delete comment"),
        description: err?.message,
      });
    }
  };

  const handleConvert = async (commentId: number) => {
    try {
      await convertMutation.mutateAsync({
        params: { path: { testPlanID: numericTestPlanId, commentID: commentId } },
      });
      toaster.success({
        title: t("comments.convertSuccess", "Converted to test case successfully"),
      });
      await refetch();
    } catch (err: any) {
      toaster.error({
        title: t("comments.convertError", "Failed to convert comment"),
        description: err?.message,
      });
    }
  };

  return (
    <Box p={6}>
      <Stack gap={4}>
        <Flex gap={2}>
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t("comments.placeholder", "Write a comment...")}
          />
          <Button onClick={handleAdd} colorPalette="brand">
            {t("common.add", "Add")}
          </Button>
        </Flex>

        {data?.comments?.map((c) => (
          <Box
            key={c.id}
            p={4}
            borderWidth="1px"
            borderColor="border.subtle"
            borderRadius="md"
            bg="bg.surface"
          >
            <Text fontWeight="bold" mb={1}>
              {c.user_name}
            </Text>
            <Text mb={3}>{c.content}</Text>
            <Flex gap={2}>
              <Button
                size="sm"
                variant="outline"
                colorPalette="red"
                onClick={() => handleDelete(c.id)}
              >
                {t("common.delete", "Delete")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                colorPalette="brand"
                onClick={() => handleConvert(c.id)}
              >
                {t("comments.convertToTestCase", "Convert to Test Case")}
              </Button>
            </Flex>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}