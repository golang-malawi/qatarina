import { Button, Text } from "@chakra-ui/react";
import type { ReactElement, ReactNode } from "react";
import { useState } from "react";
import { AppDialog } from "@/components/ui/app-dialog";

type ConfirmDialogProps = {
  trigger: ReactElement;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColorPalette?: "red" | "brand" | "green" | "orange" | "gray";
  onConfirm: () => Promise<void> | void;
};

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmColorPalette = "red",
  onConfirm,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await onConfirm();
      setOpen(false);
    } catch (error) {
      console.error("Confirm dialog action failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={(details) => !isSubmitting && setOpen(details.open)}
      title={title}
      trigger={trigger}
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            {cancelLabel}
          </Button>
          <Button
            colorPalette={confirmColorPalette}
            onClick={handleConfirm}
            loading={isSubmitting}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description ? <Text color="fg.subtle">{description}</Text> : null}
    </AppDialog>
  );
}
