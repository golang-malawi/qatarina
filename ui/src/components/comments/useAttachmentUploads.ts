import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toaster } from "@/components/ui/toaster";
import { CommentAttachment, uploadCommentAttachment } from "@/services/TestPlanService";

export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS = 10;

export type PendingAttachment = {
  localId: string;
  file: File;
  previewUrl: string;
  status: "uploading" | "done" | "error";
  attachment?: CommentAttachment;
};

// Uploads screenshots as soon as they are added so posting the comment only has to send their ids
export function useAttachmentUploads(testPlanId: number) {
  const { t } = useTranslation();
  const [items, setItems] = useState<PendingAttachment[]>([]);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  // Preview URLs are kept until reset so an image brought back with undo still shows
  const previewUrls = useRef<string[]>([]);

  useEffect(() => () => previewUrls.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const upload = useCallback(
    async (item: PendingAttachment) => {
      try {
        const attachment = await uploadCommentAttachment(testPlanId, item.file);
        setItems((prev) =>
          prev.map((p) => (p.localId === item.localId ? { ...p, status: "done", attachment } : p))
        );
      } catch (err: any) {
        setItems((prev) => prev.map((p) => (p.localId === item.localId ? { ...p, status: "error" } : p)));
        toaster.error({
          title: t("test_plans.comments.upload_error", "Failed to upload screenshot"),
          description: err?.message,
        });
      }
    },
    [testPlanId, t]
  );

  const addFiles = useCallback(
    (files: File[]) => {
      const images = files.filter((f) => ACCEPTED_IMAGE_TYPES.includes(f.type));
      if (images.length < files.length) {
        toaster.error({
          title: t("test_plans.comments.unsupported_file", "Only PNG, JPEG, GIF and WebP images can be attached"),
        });
      }
      const sized = images.filter((f) => f.size <= MAX_ATTACHMENT_BYTES);
      if (sized.length < images.length) {
        toaster.error({ title: t("test_plans.comments.file_too_large", "Images must be 10MB or smaller") });
      }
      const room = MAX_ATTACHMENTS - itemsRef.current.length;
      if (sized.length > room) {
        toaster.error({
          title: t("test_plans.comments.too_many_files", `You can attach up to ${MAX_ATTACHMENTS} images`),
        });
      }

      const added = sized.slice(0, Math.max(room, 0)).map<PendingAttachment>((file) => ({
        localId: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: "uploading",
      }));
      if (added.length === 0) return added;
      previewUrls.current.push(...added.map((item) => item.previewUrl));
      itemsRef.current = [...itemsRef.current, ...added];
      setItems(itemsRef.current);
      added.forEach(upload);
      return added;
    },
    [upload, t]
  );

  // Keeps only the attachments still present in the message
  const retain = useCallback((localIds: Set<string>) => {
    if (itemsRef.current.every((item) => localIds.has(item.localId))) return;
    itemsRef.current = itemsRef.current.filter((item) => localIds.has(item.localId));
    setItems(itemsRef.current);
  }, []);

  const retry = useCallback(
    (localId: string) => {
      const item = itemsRef.current.find((p) => p.localId === localId);
      if (!item) return;
      setItems((prev) => prev.map((p) => (p.localId === localId ? { ...p, status: "uploading" } : p)));
      upload(item);
    },
    [upload]
  );

  const reset = useCallback(() => {
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrls.current = [];
    itemsRef.current = [];
    setItems([]);
  }, []);

  return {
    items,
    itemsRef,
    addFiles,
    retain,
    retry,
    reset,
    isUploading: items.some((item) => item.status === "uploading"),
    hasErrors: items.some((item) => item.status === "error"),
  };
}

export type AttachmentUploads = ReturnType<typeof useAttachmentUploads>;
