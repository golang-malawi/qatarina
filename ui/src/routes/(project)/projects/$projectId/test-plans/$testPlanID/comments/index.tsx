import { createFileRoute } from "@tanstack/react-router";
import { Box, Button, Flex, Input, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";
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
  const { projectId, testPlanID } = Route.useParams();
  
  // Ensure your query handles testPlanID correctly (parsed as number if required by your API types)
  const numericTestPlanId = Number(testPlanID);
  const { data, refetch } = useTestPlanCommentsQuery(numericTestPlanId);
  
  const createMutation = useCreateCommentMutation();
  const deleteMutation = useDeleteCommentMutation();
  const convertMutation = useConvertCommentMutation();

  const [newComment, setNewComment] = useState("");

  const handleAdd = async () => {
    if (!newComment.trim()) return;
    try {
      await createMutation.mutateAsync({
        params: { path: { testPlanID: numericTestPlanId } },
        body: { user_id: 1, content: newComment }, // TODO: replace with actual logged-in user ID if available
      });
      setNewComment("");
      toaster.success({ title: "Comment added" });
      await refetch();
    } catch (err: any) {
      toaster.error({ 
        title: "Failed to add comment", 
        description: err?.message || "An unexpected error occurred" 
      });
    }
  };

  const handleDelete = async (commentId: number) => {
    try {
      await deleteMutation.mutateAsync({
        params: { path: { testPlanID: numericTestPlanId, commentID: commentId } },
      });
      toaster.success({ title: "Comment deleted" });
      await refetch();
    } catch (err: any) {
      toaster.error({ 
        title: "Failed to delete comment", 
        description: err?.message 
      });
    }
  };

  const handleConvert = async (commentId: number) => {
    try {
      await convertMutation.mutateAsync({
        params: { path: { testPlanID: numericTestPlanId, commentID: commentId } },
      });
      toaster.success({ title: "Converted to test case successfully" });
      await refetch();
    } catch (err: any) {
      toaster.error({ 
        title: "Failed to convert comment", 
        description: err?.message 
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
            placeholder="Write a comment..."
          />
          <Button onClick={handleAdd} colorPalette="brand">
            Add
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
            <Text fontWeight="bold" mb={1}>{c.user_name}</Text>
            <Text mb={3}>{c.content}</Text>
            <Flex gap={2}>
              <Button
                size="sm"
                variant="outline"
                colorPalette="red"
                onClick={() => handleDelete(c.id)}
              >
                Delete
              </Button>
              <Button
                size="sm"
                variant="outline"
                colorPalette="brand"
                onClick={() => handleConvert(c.id)}
              >
                Convert to Test Case
              </Button>
            </Flex>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}