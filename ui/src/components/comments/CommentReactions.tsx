import { Button, Flex, HStack, IconButton, Popover, Portal, Spinner, Text } from "@chakra-ui/react";
import { lazy, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { LuSmilePlus } from "react-icons/lu";
import { Tooltip } from "@/components/ui/tooltip";
import type { CommentReaction } from "@/services/TestPlanService";

// Shares the lazily loaded chunk with the emoji button in the comment box
const EmojiPicker = lazy(() => import("emoji-picker-react"));

// The quick reactions offered first, as in WhatsApp: 👍 ❤️ 😂 😮 😢 🙏
const QUICK_REACTIONS = ["1f44d", "2764-fe0f", "1f602", "1f62e", "1f622", "1f64f"];

type Group = { emoji: string; reactions: CommentReaction[] };

// Groups reactions by emoji, in the order each emoji was first used
function groupReactions(reactions: CommentReaction[]): Group[] {
  const groups = new Map<string, CommentReaction[]>();
  for (const r of reactions) {
    if (!r.emoji) continue;
    groups.set(r.emoji, [...(groups.get(r.emoji) ?? []), r]);
  }
  return [...groups].map(([emoji, list]) => ({ emoji, reactions: list }));
}

// The reactions under a comment; clicking one adds yours, or removes it if it is already yours
export function CommentReactions({
  reactions,
  myUserId,
  onReact,
}: {
  reactions?: CommentReaction[];
  myUserId?: number;
  onReact: (emoji: string) => void;
}) {
  const { t } = useTranslation();
  const groups = groupReactions(reactions ?? []);
  if (groups.length === 0) return null;

  return (
    <HStack gap={1.5} mt={1.5} wrap="wrap">
      {groups.map(({ emoji, reactions: list }) => {
        const mine = list.some((r) => r.user_id === myUserId);
        const names = list.map((r) =>
          r.user_id === myUserId ? t("test_plans.comments.you", "You") : r.user_name || "?"
        );
        return (
          <Tooltip key={emoji} content={names.join(", ")} openDelay={300} showArrow>
            <Button
              size="2xs"
              variant="subtle"
              colorPalette={mine ? "brand" : "gray"}
              borderRadius="full"
              px={2}
              gap={1}
              borderWidth="1px"
              borderColor={mine ? "brand.solid" : "transparent"}
              bg={mine ? undefined : "bg.muted"}
              _hover={mine ? undefined : { bg: "bg.emphasized" }}
              aria-pressed={mine}
              aria-label={t("test_plans.comments.reaction_label", {
                emoji,
                count: list.length,
                defaultValue: "{{emoji}} reaction, {{count}}",
              })}
              onClick={() => onReact(emoji)}
            >
              <Text as="span" fontSize="sm" lineHeight="1">
                {emoji}
              </Text>
              <Text as="span" fontSize="xs" fontWeight="semibold">
                {list.length}
              </Text>
            </Button>
          </Tooltip>
        );
      })}
    </HStack>
  );
}

// Opens a quick reactions bar; its "+" expands to the full emoji picker
export function ReactButton({ onReact }: { onReact: (emoji: string) => void }) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const label = t("test_plans.comments.react", "React");

  const pick = (emoji: string) => {
    setOpen(false);
    onReact(emoji);
  };

  return (
    <Popover.Root
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
      positioning={{ placement: "top-start" }}
      lazyMount
      unmountOnExit
    >
      <Popover.Trigger asChild>
        <IconButton
          size="2xs"
          variant="subtle"
          colorPalette="gray"
          bg="bg.muted"
          _hover={{ bg: "bg.emphasized" }}
          borderRadius="full"
          aria-label={label}
          title={label}
        >
          <LuSmilePlus />
        </IconButton>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content w="auto" p={0} overflow="hidden" borderRadius="full" css={{ "&:has([data-epr-part=panel])": { borderRadius: "lg" } }}>
            <Suspense
              fallback={
                <Flex px={6} py={3} align="center" justify="center">
                  <Spinner size="sm" color="fg.muted" />
                </Flex>
              }
            >
              <EmojiPicker
                reactionsDefaultOpen
                reactions={QUICK_REACTIONS}
                theme={resolvedTheme === "dark" ? "dark" : "light"}
                emojiStyle="native"
                width={320}
                height={380}
                previewConfig={{ showPreview: false }}
                searchPlaceholder={t("test_plans.comments.search_emoji", "Search emoji")}
                lazyLoadEmojis
                onReactionClick={(data) => pick(data.emoji)}
                onEmojiClick={(data) => pick(data.emoji)}
              />
            </Suspense>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
