import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Box, Button, Flex, Input, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import {
  useTestPlanCommentsQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation,
  Comment,
} from "@/services/TestPlanService";
import { toaster } from "@/components/ui/toaster";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-plans/$testPlanID/comments/"
)({
  component: TestPlanComments,
});

// Helper function to format timestamp string verbatim or prevent unwanted browser timezone shifts
function formatCommentDate(dateStr?: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const month = d.toLocaleString(undefined, { month: "short" });
    const day = d.getUTCDate();
    const year = d.getUTCFullYear();
    let hours = d.getUTCHours();
    const minutes = d.getUTCMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? "0" + minutes : minutes;

    return `${month} ${day}, ${year}, ${hours}:${minutesStr} ${ampm}`;
  } catch {
    return dateStr;
  }
}

function CommentItem({
  comment,
  numericTestPlanId,
  projectId,
  refetch,
  isReply = false,
}: {
  comment: Comment;
  numericTestPlanId: number;
  projectId: string;
  refetch: () => void;
  isReply?: boolean;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [replyContent, setReplyContent] = useState("");
  const [showReplies, setShowReplies] = useState(false);

  const createMutation = useCreateCommentMutation();
  const deleteMutation = useDeleteCommentMutation();

  const handleReply = async () => {
    if (!replyContent.trim() || !user?.user_id || !comment.id) return;
    try {
      await createMutation.mutateAsync({
        params: { path: { testPlanID: numericTestPlanId } },
        body: {
          user_id: user.user_id,
          test_plan_id: numericTestPlanId,
          content: replyContent,
          parent_comment_id: comment.id,
        },
      });
      setReplyContent("");
      setShowReplies(true);
      toaster.success({ title: t("test_plans.comments.reply_success", "Reply added") });
      refetch();
    } catch (err: any) {
      toaster.error({
        title: t("test_plans.comments.reply_error", "Failed to add reply"),
        description: err?.message,
      });
    }
  };

  const handleDelete = async (commentId: number | string) => {
    try {
      await deleteMutation.mutateAsync({
        params: { path: { testPlanID: numericTestPlanId, commentID: String(commentId) } },
      });
      toaster.success({ title: t("test_plans.comments.delete_success", "Comment deleted") });
      refetch();
    } catch (err: any) {
      toaster.error({
        title: t("test_plans.comments.delete_error", "Failed to delete comment"),
        description: err?.message,
      });
    }
  };

  const handleConvert = (content: string) => {
    navigate({
      to: "/projects/$projectId/test-cases/new",
      params: { projectId },
      search: { title: content },
    });
  };

  const repliesArray = comment.replies ?? [];
  const hasReplies = repliesArray.length > 0;
  const formattedDate = formatCommentDate(comment.created_at);

  return (
    <Box
      p={isReply ? 3 : 4}
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="md"
      bg={isReply ? "bg.subtle" : "bg.surface"}
    >
      <Flex justify="space-between" align="center" mb={1}>
        <Text fontWeight="bold" fontSize={isReply ? "sm" : "md"}>
          {comment.user_name}
        </Text>
        {formattedDate && (
          <Text fontSize="xs" color="fg.muted">
            {formattedDate}
          </Text>
        )}
      </Flex>
      <Text mb={3} fontSize={isReply ? "sm" : "md"} color={isReply ? "fg.muted" : "fg.default"}>
        {comment.content}
      </Text>

      {/* GitHub-style inline reply box */}
      <Flex gap={2} mb={3}>
        <Input
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          placeholder={t("test_plans.comments.reply_placeholder", "Leave a reply...")}
          size="sm"
        />
        <Button size="sm" onClick={handleReply} colorPalette="brand">
          {t("test_plans.comments.send_reply", "Reply")}
        </Button>
      </Flex>

      <Flex gap={2} mb={2} align="center" wrap="wrap">
        <Button
          size="sm"
          variant="outline"
          colorPalette="red"
          onClick={() => comment.id && handleDelete(comment.id)}
        >
          {t("test_plans.comments.delete", "Delete")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          colorPalette="brand"
          onClick={() => comment.content && handleConvert(comment.content)}
        >
          {t("test_plans.comments.convert", "Convert to Test Case")}
        </Button>

        {/* View/Hide Replies button is now cleanly aligned with other actions */}
        {hasReplies && (
          <Button
            size="sm"
            variant="ghost"
            colorPalette="gray"
            onClick={() => setShowReplies(!showReplies)}
          >
            {showReplies
              ? t("test_plans.comments.hide_replies", "Hide replies")
              : t("test_plans.comments.view_replies", `View replies (${repliesArray.length})`)}
          </Button>
        )}
      </Flex>

      {showReplies && hasReplies && (
        <Stack gap={3} pl={6} mt={3} borderLeftWidth="1px" borderColor="border.subtle">
          {repliesArray.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              numericTestPlanId={numericTestPlanId}
              projectId={projectId}
              refetch={refetch}
              isReply={true}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}

function TestPlanComments() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { projectId, testPlanID } = Route.useParams();

  const numericTestPlanId = Number(testPlanID);
  const { data, refetch } = useTestPlanCommentsQuery(testPlanID);

  const createMutation = useCreateCommentMutation();
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
      toaster.success({ title: t("test_plans.comments.add_success", "Comment added") });
      await refetch();
    } catch (err: any) {
      toaster.error({
        title: t("test_plans.comments.add_error", "Failed to add comment"),
        description: err?.message || t("test_plans.comments.unexpected_error", "An unexpected error occurred"),
      });
    }
  };

  const sortedComments = data?.comments
    ? [...data.comments].sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      })
    : [];

  return (
    <Box p={6}>
      <Stack gap={4}>
        <Flex gap={2}>
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t("test_plans.comments.placeholder", "Write a comment...")}
          />
          <Button onClick={handleAdd} colorPalette="brand">
            {t("test_plans.comments.add", "Add")}
          </Button>
        </Flex>

        {sortedComments.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            numericTestPlanId={numericTestPlanId}
            projectId={projectId}
            refetch={refetch}
          />
        ))}
      </Stack>
    </Box>
  );
}