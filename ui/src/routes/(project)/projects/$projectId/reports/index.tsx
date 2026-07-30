import { useState } from "react";
import {
  Box,
  Stack,
  Table,
  Heading,
  Button,
  Flex,
  Spinner,
  Text,
  IconButton,
  SimpleGrid,
} from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";
import { LuEye, LuDownload, LuTrash } from "react-icons/lu";
import { Toaster, toaster } from "@/components/ui/toaster";
import {
  useReportsQuery,
  useCreateReportMutation,
  useDeleteReportMutation,
  downloadReport,
  viewReportBlob,
  Report,
} from "@/services/ReportService";
import { useProjectTestPlansQuery } from "@/services/TestPlanService";
import { DynamicForm } from "@/components/form/DynamicForm";
import {
  reportCreationSchema,
  ReportCreationFormData,
} from "@/data/forms/report-schemas";
import { createReportFields } from "@/data/forms/report-field-configs";
import { AppDialog } from "@/components/ui/app-dialog";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/(project)/projects/$projectId/reports/")({
  component: ReportsPage,
});

function ReportsPage() {
  const { t } = useTranslation();
  const projectId = Route.useParams().projectId as string;

  const { data, isLoading, error, refetch } = useReportsQuery(projectId);
  const reports: Report[] = data?.reports ?? [];
  const createMutation = useCreateReportMutation();
  const deleteMutation = useDeleteReportMutation();

  const { data: testPlansData } = useProjectTestPlansQuery(projectId);
  const testPlans = (testPlansData?.test_plans ?? []).map((tp: any) => ({
    id: tp.id,
    title: tp.description ?? tp.name ?? t("reports.untitled_plan"),
  }));

  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = (id: string) => {
    if (!window.confirm(t("reports.delete.confirm"))) return;

    deleteMutation.mutate(
      { params: { path: { projectID: projectId, reportID: id } } },
      {
        onSuccess: () => {
          toaster.create({ title: t("reports.delete.success"), type: "success" });
          refetch();
        },
        onError: () => {
          toaster.create({ title: t("reports.delete.error"), type: "error" });
        },
      }
    );
  };

  const handleDownload = async (reportID: string) => {
    const blob = await downloadReport(projectId, reportID);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${reportID}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleView = async (reportID: string) => {
    const blob = await viewReportBlob(projectId, reportID);
    const url = window.URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  async function handleCreate(values: ReportCreationFormData) {
    await createMutation.mutateAsync({
      params: { path: { projectID: projectId } },
      body: {
        project_id: Number(projectId),
        test_plan_id: Number(values.test_plan_id),
        name: values.name,
        type: values.type,
        status: values.status,
      },
    });

    toaster.create({ title: t("reports.create.success"), type: "success" });
    refetch();
    setIsOpen(false);
  }

  const totalReports = reports.length;
  const completedReports = reports.filter((r) => r.status === "Completed").length;
  const inProgressReports = reports.filter((r) => r.status === "In Progress").length;
  const failedReports = reports.filter((r) => r.status === "Failed").length;

  return (
    <Box p={6}>
      <Toaster />

      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg" color="fg.heading">{t("reports")}</Heading>
        <Button colorPalette="brand" onClick={() => setIsOpen(true)}>
          {t("reports.create_new")}
        </Button>
      </Flex>

      <AppDialog
        open={isOpen}
        onOpenChange={() => setIsOpen(false)}
        title={t("reports.generate")}
      >
        <DynamicForm
          schema={reportCreationSchema}
          fields={createReportFields(testPlans)}
          onSubmit={handleCreate}
          submitText={t("reports.generate")}
          submitLoading={createMutation.isPending}
          layout="vertical"
          spacing={4}
          defaultValues={{
            test_plan_id: "",
            name: "",
            type: "Detailed",
            status: "In Progress",
          }}
        />
      </AppDialog>

      <SimpleGrid columns={[1, 2, 4]} gap={4} mb={6}>
        <Box p={4} shadow="card" borderRadius="lg" bg="bg.surface">
          <Text fontSize="sm" color="fg.muted">{t("reports.total")}</Text>
          <Heading size="lg">{totalReports}</Heading>
        </Box>

        <Box p={4} shadow="card" borderRadius="lg" bg="bg.surface">
          <Text fontSize="sm" color="fg.muted">{t("reports.completed")}</Text>
          <Heading size="lg" color="fg.success">{completedReports}</Heading>
        </Box>

        <Box p={4} shadow="card" borderRadius="lg" bg="bg.surface">
          <Text fontSize="sm" color="fg.muted">{t("reports.in_progress")}</Text>
          <Heading size="lg" color="fg.warning">{inProgressReports}</Heading>
        </Box>

        <Box p={4} shadow="card" borderRadius="lg" bg="bg.surface">
          <Text fontSize="sm" color="fg.muted">{t("reports.failed")}</Text>
          <Heading size="lg" color="fg.error">{failedReports}</Heading>
        </Box>
      </SimpleGrid>

      {isLoading ? (
        <Flex justify="center" py={10}>
          <Spinner size="lg" color="brand.solid" />
        </Flex>
      ) : error ? (
        <Text color="fg.error">{(error as Error).message}</Text>
      ) : (
        <Stack gap="6">
          <Table.Root size="md">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>{t("reports.column.id")}</Table.ColumnHeader>
                <Table.ColumnHeader>{t("reports.column.name")}</Table.ColumnHeader>
                <Table.ColumnHeader>{t("reports.column.type")}</Table.ColumnHeader>
                <Table.ColumnHeader>{t("reports.column.status")}</Table.ColumnHeader>
                <Table.ColumnHeader>{t("reports.column.created_at")}</Table.ColumnHeader>
                <Table.ColumnHeader>{t("reports.column.actions")}</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {reports.map((report) => (
                <Table.Row key={report.id ?? Math.random()}>
                  <Table.Cell>{report.id ?? "-"}</Table.Cell>
                  <Table.Cell>{report.name ?? "-"}</Table.Cell>
                  <Table.Cell>{report.type ?? "-"}</Table.Cell>
                  <Table.Cell>{report.status ?? "-"}</Table.Cell>
                  <Table.Cell>
                    {report.created_at
                      ? new Date(report.created_at).toLocaleDateString()
                      : "-"}
                  </Table.Cell>
                  <Table.Cell>
                    <Flex gap={2}>
                      <IconButton
                        aria-label={t("reports.view")}
                        onClick={() => report.id && handleView(report.id)}
                        colorPalette="info"
                        size="sm"
                      >
                        <LuEye />
                      </IconButton>

                      <IconButton
                        aria-label={t("reports.download")}
                        onClick={() => report.id && handleDownload(report.id)}
                        colorPalette="success"
                        size="sm"
                      >
                        <LuDownload />
                      </IconButton>

                      <IconButton
                        aria-label={t("reports.delete")}
                        onClick={() => report.id && handleDelete(report.id)}
                        colorPalette="danger"
                        size="sm"
                        loading={deleteMutation.isPending}
                      >
                        <LuTrash />
                      </IconButton>
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Stack>
      )}
    </Box>
  );
}

export default ReportsPage;
