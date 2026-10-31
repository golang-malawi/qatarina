import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import {
  LuArrowUp,
  LuChevronDown,
  LuChevronUp,
  LuFilePlus,
  LuMessageSquare,
  LuReply,
  LuTrash2,
} from "react-icons/lu";
import { useAuth } from "@/context/AuthContext";
import {
  useTestPlanCommentsInfiniteQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation,
  Comment,
} from "@/services/TestPlanService";
import { toaster } from "@/components/ui/toaster";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CommentBody } from "@/components/comments/CommentBody";
import { CommentComposer } from "@/components/comments/CommentComposer";
import { stripAttachmentTokens } from "@/components/comments/attachmentTokens";

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

function Composer({
  authorName,
  compact = false,
  ...props
}: { authorName?: string } & ComponentProps<typeof CommentComposer>) {
  return (
    <Flex gap={3} align="flex-start">
      <Avatar
        name={authorName}
        size={compact ? "xs" : "sm"}
        colorPalette={avatarPalette(authorName)}
        flexShrink={0}
      />
      <CommentComposer compact={compact} {...props} />
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

  const [isReplying, setIsReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(true);

  const createMutation = useCreateCommentMutation();
  const deleteMutation = useDeleteCommentMutation();

  const handleReply = async (content: string, attachmentIds: string[]) => {
    if (!user?.user_id || !comment.id) return false;
    try {
      await createMutation.mutateAsync({
        params: { path: { testPlanID: numericTestPlanId } },
        body: {
          user_id: user.user_id,
          test_plan_id: numericTestPlanId,
          content,
          parent_comment_id: comment.id,
          attachment_ids: attachmentIds,
        },
      });
      setIsReplying(false);
      setShowReplies(true);
      toaster.success({ title: t("test_plans.comments.reply_success", "Reply added") });
      refetch();
      return true;
    } catch (err: any) {
      toaster.error({
        title: t("test_plans.comments.reply_error", "Failed to add reply"),
        description: err?.message,
      });
      return false;
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
      search: { title: stripAttachmentTokens(content) },
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

        <CommentBody
          testPlanId={numericTestPlanId}
          content={comment.content}
          attachments={comment.attachments}
          isOwn={isOwn}
        />

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
                testPlanId={numericTestPlanId}
                onSubmit={handleReply}
                isSubmitting={createMutation.isPending}
                placeholder={t("test_plans.comments.reply_placeholder", "Leave a reply...")}
                authorName={user?.displayName}
                autoFocus
                compact
                onCancel={() => setIsReplying(false)}
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
  const { data, refetch, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } =
    useTestPlanCommentsInfiniteQuery(numericTestPlanId);

  const createMutation = useCreateCommentMutation();
  const handleAdd = async (content: string, attachmentIds: string[]) => {
    if (!user?.user_id) return false;
    try {
      await createMutation.mutateAsync({
        params: { path: { testPlanID: numericTestPlanId } },
        body: {
          user_id: user.user_id,
          test_plan_id: numericTestPlanId,
          content,
          attachment_ids: attachmentIds,
        },
      });
      toaster.success({ title: t("test_plans.comments.add_success", "Comment added") });
      await refetch();
      return true;
    } catch (err: any) {
      toaster.error({
        title: t("test_plans.comments.add_error", "Failed to add comment"),
        description: err?.message || t("test_plans.comments.unexpected_error", "An unexpected error occurred"),
      });
      return false;
    }
  };

  // Pages come back newest first; a comment can show up twice if new ones were posted between page loads
  const sortedComments = useMemo(() => {
    const seen = new Set<string>();
    return (data?.pages ?? [])
      .flatMap((page) => page.comments ?? [])
      .filter((c) => !!c.id && !seen.has(c.id) && !!seen.add(c.id));
  }, [data]);
  const totalComments = data?.pages[0]?.pagination?.total ?? sortedComments.length;

  // Load the next page when the end of the list scrolls into view
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "200px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, sortedComments.length]);

  // Show a "Back to top" button once the comment box has scrolled up out of view
  const composerRef = useRef<HTMLDivElement>(null);
  const discussionRef = useRef<HTMLDivElement>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = composerRef.current?.getBoundingClientRect();
        setShowBackToTop(!!rect && rect.bottom < 0);
      });
    };
    // Captured on the document because the page scrolls inside the app shell, not the window
    document.addEventListener("scroll", update, { capture: true, passive: true });
    update();
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("scroll", update, { capture: true });
    };
  }, []);

  const scrollToComposer = () => {
    discussionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    // Focus once the scroll has settled: the editor scrolls its cursor into view on focus,
    // which would cut the smooth scroll short
    window.setTimeout(
      () => composerRef.current?.querySelector<HTMLElement>(".ProseMirror")?.focus({ preventScroll: true }),
      700
    );
  };

  return (
    <Box p={6}>
      <Box
        ref={discussionRef}
        scrollMarginTop={4}
        borderWidth="1px"
        borderColor="border.subtle"
        borderRadius="xl"
        bg="bg.panel"
        overflow="hidden"
      >
        <Flex align="center" gap={2} px={5} py={3} borderBottomWidth="1px" borderColor="border.subtle">
          <LuMessageSquare />
          <Text fontWeight="semibold">{t("test_plans.comments.title", "Discussion")}</Text>
          <Badge size="sm" variant="subtle" borderRadius="full">
            {totalComments}
          </Badge>
        </Flex>

        {/* Composer sits above the comments since the newest ones are shown first */}
        <Box ref={composerRef} px={5} py={4} borderBottomWidth="1px" borderColor="border.subtle" bg="bg.subtle">
          <Composer
            testPlanId={numericTestPlanId}
            onSubmit={handleAdd}
            isSubmitting={createMutation.isPending}
            placeholder={t("test_plans.comments.placeholder", "Write a comment...")}
            authorName={user?.displayName}
          />
        </Box>

        <Stack gap={6} px={5} py={5}>
          {isPending ? (
            <Flex justify="center" py={8}>
              <Spinner color="fg.muted" />
            </Flex>
          ) : sortedComments.length === 0 ? (
            <Stack align="center" gap={1} py={8} color="fg.muted">
              <LuMessageSquare size={28} />
              <Text fontWeight="medium">{t("test_plans.comments.empty_title", "No comments yet")}</Text>
              <Text fontSize="sm">
                {t("test_plans.comments.empty_description", "Start the conversation about this test plan above.")}
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

          <Box ref={sentinelRef} h="1px" />
          {isFetchingNextPage && (
            <HStack justify="center" gap={2} color="fg.muted" fontSize="sm">
              <Spinner size="sm" />
              <Text>{t("test_plans.comments.loading_more", "Loading more comments...")}</Text>
            </HStack>
          )}
          {!hasNextPage && (data?.pages.length ?? 0) > 1 && (
            <Text textAlign="center" fontSize="sm" color="fg.subtle">
              {t("test_plans.comments.end_of_discussion", "You've reached the start of the discussion")}
            </Text>
          )}
        </Stack>
      </Box>

      {showBackToTop && (
        <Button
          position="fixed"
          bottom={8}
          // Kept clear of the React Query devtools button in the corner during development
          right={20}
          zIndex="sticky"
          size="sm"
          colorPalette="brand"
          borderRadius="full"
          boxShadow="lg"
          onClick={scrollToComposer}
        >
          <LuArrowUp />
          {t("test_plans.comments.back_to_top", "Back to top")}
        </Button>
      )}
    </Box>
  );
}
