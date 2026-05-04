import { CloseButton, Dialog, Portal } from "@chakra-ui/react";
import type { ReactElement, ReactNode } from "react";

type AppDialogProps = {
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (details: { open: boolean }) => void;
  showCloseTrigger?: boolean;
  onClose?: () => void;
  closeButtonLabel?: string;
};

export function AppDialog({
  title,
  children,
  footer,
  trigger,
  open,
  onOpenChange,
  showCloseTrigger = false,
  onClose,
  closeButtonLabel = "Close dialog",
}: AppDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bg="bg.surface" border="sm" borderColor="border.subtle">
            <Dialog.Header>
              <Dialog.Title>{title}</Dialog.Title>
              {showCloseTrigger ? (
                <Dialog.CloseTrigger asChild>
                  <CloseButton aria-label={closeButtonLabel} onClick={onClose} />
                </Dialog.CloseTrigger>
              ) : null}
            </Dialog.Header>

            <Dialog.Body>{children}</Dialog.Body>

            {footer ? <Dialog.Footer>{footer}</Dialog.Footer> : null}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
