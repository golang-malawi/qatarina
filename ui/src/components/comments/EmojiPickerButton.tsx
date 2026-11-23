import { Flex, IconButton, Popover, Portal, Spinner } from "@chakra-ui/react";
import { lazy, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { LuSmile } from "react-icons/lu";

// The picker and its emoji data are only downloaded the first time someone opens it
const EmojiPicker = lazy(() => import("emoji-picker-react"));

const PICKER_WIDTH = 320;
const PICKER_HEIGHT = 380;

export function EmojiPickerButton({
  onSelect,
  onPicked,
}: {
  onSelect: (emoji: string) => void;
  // Called once the picker has closed after a pick, to put focus back in the message
  onPicked: () => void;
}) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const label = t("test_plans.comments.add_emoji", "Add emoji");

  return (
    <Popover.Root
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
      positioning={{ placement: "top-start" }}
      lazyMount
    >
      <Popover.Trigger asChild>
        <IconButton size="xs" variant="ghost" color="fg.muted" borderRadius="full" aria-label={label} title={label}>
          <LuSmile />
        </IconButton>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content w="auto" p={0} overflow="hidden" borderRadius="lg">
            <Suspense
              fallback={
                <Flex w={`${PICKER_WIDTH}px`} h={`${PICKER_HEIGHT}px`} align="center" justify="center">
                  <Spinner color="fg.muted" />
                </Flex>
              }
            >
              <EmojiPicker
                theme={resolvedTheme === "dark" ? "dark" : "light"}
                emojiStyle="native"
                width={PICKER_WIDTH}
                height={PICKER_HEIGHT}
                previewConfig={{ showPreview: false }}
                searchPlaceholder={t("test_plans.comments.search_emoji", "Search emoji")}
                autoFocusSearch
                lazyLoadEmojis
                onEmojiClick={(data) => {
                  onSelect(data.emoji);
                  setOpen(false);
                  // The popover moves focus to its button a frame after closing, so wait for that
                  requestAnimationFrame(() => requestAnimationFrame(onPicked));
                }}
              />
            </Suspense>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
