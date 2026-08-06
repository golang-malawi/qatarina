import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Box, Button, Flex, Input, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext"; 
import {
  useTestPlanCommentsQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation,
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
  const navigate = useNavigate();
  const { projectId, testPlanID } = Route.useParams();

  const numericTestPlanId = Number(testPlanID);
  const { data, refetch } = useTestPlanCommentsQuery(testPlanID);

  const createMutation = useCreateCommentMutation();
  const deleteMutation = useDeleteCommentMutation();

  const [newComment, setNewComment] = useState("");

  const handleAdd = async () => {
    if (!newComment.trim() || !user?.user_id) return;
    try {
      await createMutation.mutateAsync({
        params: { path: { testPlanID: numericTestPlanId } },
        body: {
          user_id: user.user_id,
          test_plan_id: numericTestPlanId,
          content: newComment,
        },
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

  const handleDelete = async (commentId: number | string) => {
    try {
      await deleteMutation.mutateAsync({
        params: { path: { testPlanID: numericTestPlanId, commentID: String(commentId) } },
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

  const handleConvert = (content: string) => {
    navigate({
      to: "/projects/$projectId/test-cases/new",
      params: { projectId },
      search: {
        title: content,
      },
    });
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
                onClick={() => c.id && handleDelete(c.id)}
              >
                {t("common.delete", "Delete")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                colorPalette="brand"
                onClick={() => c.content && handleConvert(c.content)}
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