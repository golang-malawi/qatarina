import { Button, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { AppDialog } from "@/components/ui/app-dialog";
import type { SelectionDrafts } from "@/services/TestCaseService";

type DraftsSkippedDialogProps = {
  /** The drafts in the selection, the dialog is open while this is set */
  drafts: SelectionDrafts | null;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Asks the user to confirm that the drafts in their selection will be skipped,
 * since drafts cannot be assigned to testers until they are published.
 */
export function DraftsSkippedDialog({ drafts, onCancel, onConfirm }: DraftsSkippedDialogProps) {
  const { t } = useTranslation();
  const count = drafts?.count ?? 0;
  const codes = drafts?.codes ?? [];
  const listed = codes.join(", ");

  return (
    <AppDialog
      open={drafts !== null}
      onOpenChange={(details) => !details.open && onCancel()}
      title={t("test_cases.drafts_skipped.title")}
      footer={
        <>
          <Button variant="outline" onClick={onCancel}>
            {t("test_plans.cancel")}
          </Button>
          <Button colorPalette="brand" onClick={onConfirm}>
            {t("test_cases.drafts_skipped.continue")}
          </Button>
        </>
      }
    >
      <Stack gap={2}>
        <Text color="fg.subtle">{t("test_cases.drafts_skipped.description", { count })}</Text>
        {codes.length > 0 && (
          <Text fontSize="sm" color="fg.muted">
            {t("test_cases.drafts_skipped.codes", {
              codes:
                count > codes.length
                  ? t("test_cases.drafts_skipped.more", { codes: listed, count: count - codes.length })
                  : listed,
            })}
          </Text>
        )}
      </Stack>
    </AppDialog>
  );
}
