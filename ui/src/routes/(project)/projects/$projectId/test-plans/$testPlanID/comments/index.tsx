import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Badge, Box, Button, Flex, HStack, IconButton, Stack, Text, Textarea } from "@chakra-ui/react";
import { useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  LuChevronDown,
  LuChevronUp,
  LuFilePlus,
  LuMessageSquare,
  LuReply,
  LuSendHorizontal,
  LuTrash2,
} from "react-icons/lu";
import { useAuth } from "@/context/AuthContext";
import {
  useTestPlanCommentsQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation,
  Comment,
} from "@/services/TestPlanService";
import { toaster } from "@/components/ui/toaster";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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

const AVATAR_PALETTES = ["blue", "green", "purple", "orange", "teal", "pink", "cyan", "red"];

// Gives each person a stable avatar colour so they are easy to tell apart in a thread
function avatarPalette(name?: string) {
  if (!name) return "gray";
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

function byOldestFirst(a: Comment, b: Comment) {
  const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
  const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
  return timeA - timeB;
}

// Message composer: Enter adds a new line, Ctrl/Cmd+Enter sends
function Composer({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  placeholder,
  authorName,
  autoFocus,
  onCancel,
  compact = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  placeholder: string;
  authorName?: string;
  autoFocus?: boolean;
  onCancel?: () => void;
  compact?: boolean;
}) {
  const { t } = useTranslation();

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSubmit();
    } else if (e.key === "Escape" && onCancel) {
      onCancel();
    }
  };

  return (
    <Flex gap={3} align="flex-start">
      <Avatar
        name={authorName}
        size={compact ? "xs" : "sm"}
        colorPalette={avatarPalette(authorName)}
        flexShrink={0}
      />
      <Box
        flex="1"
        borderWidth="1px"
        borderColor="border.subtle"
        borderRadius="xl"
        bg="bg.panel"
        _focusWithin={{ borderColor: "colorPalette.solid", boxShadow: "0 0 0 1px var(--chakra-colors-color-palette-solid)" }}
        colorPalette="brand"
        overflow="hidden"
      >
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          size={compact ? "sm" : "md"}
          rows={compact ? 1 : 2}
          autoresize
          autoFocus={autoFocus}
          border="none"
          bg="transparent"
          _focusVisible={{ outline: "none", boxShadow: "none" }}
          resize="none"
          px={3}
          pt={2}
        />
        <Flex justify="space-between" align="center" px={3} pb={2} gap={2}>
          <Text fontSize="xs" color="fg.subtle">
            {t("test_plans.comments.send_hint", "Ctrl + Enter to send")}
          </Text>
          <HStack gap={1}>
            {onCancel && (
              <Button size="xs" variant="ghost" onClick={onCancel}>
                {t("test_plans.comments.cancel", "Cancel")}
              </Button>
            )}
            <IconButton
              size="xs"
              colorPalette="brand"
              borderRadius="full"
              aria-label={t("test_plans.comments.send", "Send")}
              onClick={onSubmit}
              loading={isSubmitting}
              disabled={!value.trim()}
            >
              <LuSendHorizontal />
            </IconButton>
          </HStack>
        </Flex>
      </Box>
    </Flex>
  );
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
  const [isReplying, setIsReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(true);

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
      setIsReplying(false);
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

  const repliesArray = [...(comment.replies ?? [])].sort(byOldestFirst);
  const hasReplies = repliesArray.length > 0;
  const formattedDate = formatCommentDate(comment.created_at);
  const isOwn = !!user?.user_id && comment.user_id === user.user_id;

  return (
    <Flex gap={3} align="flex-start">
      <Avatar
        name={comment.user_name}
        size={isReply ? "xs" : "sm"}
        colorPalette={avatarPalette(comment.user_name)}
        flexShrink={0}
      />

      <Box flex="1" minW={0}>
        <HStack gap={2} mb={1} wrap="wrap">
          <Text fontWeight="semibold" fontSize="sm">
            {comment.user_name}
          </Text>
          {isOwn && (
            <Badge size="sm" variant="subtle" colorPalette="brand">
              {t("test_plans.comments.you", "You")}
            </Badge>
          )}
          {formattedDate && (
            <Text fontSize="xs" color="fg.muted">
              {formattedDate}
            </Text>
          )}
        </HStack>

        <Box
          display="inline-block"
          maxW="full"
          px={4}
          py={2.5}
          bg={isOwn ? "brand.subtle" : "bg.muted"}
          borderRadius="2xl"
          borderTopLeftRadius="sm"
        >
          <Text fontSize="sm" whiteSpace="pre-wrap" wordBreak="break-word" color="fg">
            {comment.content}
          </Text>
        </Box>

        <HStack gap={2} mt={2} wrap="wrap">
          <Button
            size="2xs"
            variant="subtle"
            colorPalette="brand"
            borderRadius="full"
            px={2.5}
            onClick={() => setIsReplying(true)}
          >
            <LuReply />
            {t("test_plans.comments.send_reply", "Reply")}
          </Button>
          <Button
            size="2xs"
            variant="subtle"
            colorPalette="green"
            borderRadius="full"
            px={2.5}
            onClick={() => comment.content && handleConvert(comment.content)}
          >
            <LuFilePlus />
            {t("test_plans.comments.convert", "Convert to Test Case")}
          </Button>
          <ConfirmDialog
            trigger={
              <Button size="2xs" variant="subtle" colorPalette="red" borderRadius="full" px={2.5}>
                <LuTrash2 />
                {t("test_plans.comments.delete", "Delete")}
              </Button>
            }
            title={t("test_plans.comments.delete_confirm_title", "Delete comment?")}
            description={t(
              "test_plans.comments.delete_confirm_description",
              "This comment will be permanently removed."
            )}
            confirmLabel={t("test_plans.comments.delete", "Delete")}
            onConfirm={() => (comment.id ? handleDelete(comment.id) : undefined)}
          />
          {hasReplies && (
            <Button
              size="2xs"
              variant="ghost"
              colorPalette="brand"
              borderRadius="full"
              px={2.5}
              onClick={() => setShowReplies(!showReplies)}
            >
              {showReplies ? <LuChevronUp /> : <LuChevronDown />}
              {showReplies
                ? t("test_plans.comments.hide_replies", "Hide replies")
                : t("test_plans.comments.view_replies", `View replies (${repliesArray.length})`)}
            </Button>
          )}
        </HStack>

        {(isReplying || (showReplies && hasReplies)) && (
          <Stack gap={4} mt={3} pl={4} borderLeftWidth="2px" borderColor="border.subtle">
            {showReplies &&
              repliesArray.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  numericTestPlanId={numericTestPlanId}
                  projectId={projectId}
                  refetch={refetch}
                  isReply={true}
                />
              ))}
            {isReplying && (
              <Composer
                value={replyContent}
                onChange={setReplyContent}
                onSubmit={handleReply}
                isSubmitting={createMutation.isPending}
                placeholder={t("test_plans.comments.reply_placeholder", "Leave a reply...")}
                authorName={user?.displayName}
                autoFocus
                compact
                onCancel={() => {
                  setIsReplying(false);
                  setReplyContent("");
                }}
              />
            )}
          </Stack>
        )}
      </Box>
    </Flex>
  );
}

function TestPlanComments() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { projectId, testPlanID } = Route.useParams();

  const numericTestPlanId = Number(testPlanID);
  const { data, refetch } = useTestPlanCommentsQuery(Number(testPlanID));

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

  // Newest comments first
  const sortedComments = data?.comments ? [...data.comments].sort((a, b) => byOldestFirst(b, a)) : [];

  return (
    <Box p={6}>
      <Box borderWidth="1px" borderColor="border.subtle" borderRadius="xl" bg="bg.panel" overflow="hidden">
        <Flex align="center" gap={2} px={5} py={3} borderBottomWidth="1px" borderColor="border.subtle">
          <LuMessageSquare />
          <Text fontWeight="semibold">{t("test_plans.comments.title", "Discussion")}</Text>
          <Badge size="sm" variant="subtle" borderRadius="full">
            {sortedComments.length}
          </Badge>
        </Flex>

        <Stack gap={6} px={5} py={5}>
          {sortedComments.length === 0 ? (
            <Stack align="center" gap={1} py={8} color="fg.muted">
              <LuMessageSquare size={28} />
              <Text fontWeight="medium">{t("test_plans.comments.empty_title", "No comments yet")}</Text>
              <Text fontSize="sm">
                {t("test_plans.comments.empty_description", "Start the conversation about this test plan below.")}
              </Text>
            </Stack>
          ) : (
            sortedComments.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                numericTestPlanId={numericTestPlanId}
                projectId={projectId}
                refetch={refetch}
              />
            ))
          )}
        </Stack>

        <Box px={5} py={4} borderTopWidth="1px" borderColor="border.subtle" bg="bg.subtle">
          <Composer
            value={newComment}
            onChange={setNewComment}
            onSubmit={handleAdd}
            isSubmitting={createMutation.isPending}
            placeholder={t("test_plans.comments.placeholder", "Write a comment...")}
            authorName={user?.displayName}
          />
        </Box>
      </Box>
    </Box>
  );
}
