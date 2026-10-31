import { Box, CloseButton, Dialog, Flex, Image, Link, Portal, Skeleton, Text, Wrap } from "@chakra-ui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuExternalLink, LuImageOff } from "react-icons/lu";
import { CommentAttachment, useCommentAttachmentImage } from "@/services/TestPlanService";

function AttachmentThumbnail({
  testPlanId,
  attachment,
  onOpen,
}: {
  testPlanId: number;
  attachment: CommentAttachment;
  onOpen: (src: string) => void;
}) {
  const { t } = useTranslation();
  const { src, isError } = useCommentAttachmentImage(testPlanId, attachment.id);

  if (isError) {
    return (
      <Flex
        w="160px"
        h="110px"
        align="center"
        justify="center"
        direction="column"
        gap={1}
        borderWidth="1px"
        borderColor="border.subtle"
        borderRadius="lg"
        color="fg.muted"
      >
        <LuImageOff />
        <Text fontSize="xs">{t("test_plans.comments.image_unavailable", "Image unavailable")}</Text>
      </Flex>
    );
  }

  if (!src) {
    return <Skeleton w="200px" h="130px" borderRadius="lg" />;
  }

  return (
    <Box
      as="button"
      onClick={() => onOpen(src)}
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="lg"
      overflow="hidden"
      cursor="zoom-in"
      transition="box-shadow 0.15s, transform 0.15s"
      _hover={{ boxShadow: "md", transform: "translateY(-1px)" }}
      title={attachment.file_name}
    >
      <Image src={src} alt={attachment.file_name} maxH="200px" maxW="320px" objectFit="cover" display="block" />
    </Box>
  );
}

export function CommentAttachments({
  testPlanId,
  attachments,
}: {
  testPlanId: number;
  attachments: CommentAttachment[];
}) {
  const { t } = useTranslation();
  const [viewing, setViewing] = useState<{ src: string; attachment: CommentAttachment } | null>(null);

  if (attachments.length === 0) return null;

  return (
    <>
      <Wrap gap={2} mt={2}>
        {attachments.map((attachment) => (
          <AttachmentThumbnail
            key={attachment.id}
            testPlanId={testPlanId}
            attachment={attachment}
            onOpen={(src) => setViewing({ src, attachment })}
          />
        ))}
      </Wrap>

      <Dialog.Root open={!!viewing} onOpenChange={(e) => !e.open && setViewing(null)} size="xl" placement="center">
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="min(1200px, 95vw)">
              <Dialog.Header>
                <Dialog.Title fontSize="sm" truncate>
                  {viewing?.attachment.file_name}
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body display="flex" justifyContent="center">
                {viewing && (
                  <Image
                    src={viewing.src}
                    alt={viewing.attachment.file_name}
                    maxH="75vh"
                    maxW="full"
                    objectFit="contain"
                    borderRadius="md"
                  />
                )}
              </Dialog.Body>
              <Dialog.Footer>
                {viewing && (
                  <Link href={viewing.src} target="_blank" rel="noopener noreferrer" fontSize="sm" colorPalette="brand">
                    <LuExternalLink />
                    {t("test_plans.comments.open_full_size", "Open full size")}
                  </Link>
                )}
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
