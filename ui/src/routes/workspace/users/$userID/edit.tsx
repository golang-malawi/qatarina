import { createFileRoute, useNavigate } from "@tanstack/react-router";
import z from "zod";
import { useGetUserQuery, useUpdateUserMutation } from "@/services/UserService";
import { DynamicForm, FieldConfig } from "@/components/form";
import { Box, Heading } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { useState } from "react";
import { useOrgsQuery } from "@/services/OrgsService";
import { useTranslation } from "react-i18next";
import { CountryField } from "@/data/forms/CountryField";

export const Route = createFileRoute("/workspace/users/$userID/edit")({
  component: EditUserProfile,
});

const schema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  display_name: z.string().min(1, "Display name is required"),
  phone: z.string().optional().default(""),
  org_id: z.union([
    z.number().int().positive("Organization ID is required"),
    z.string().transform(Number),
  ]).pipe(z.number().int().positive("Organization ID is required")),
  city: z.string().min(1, "City is required"),
  address: z.string().optional().default(""),
  country_iso: z.string().optional().default(""),
});

function EditUserProfile() {
  const { userID } = Route.useParams();
  const navigate = useNavigate();
  const { data: user } = useGetUserQuery(userID);
  const { data: orgsResponse } = useOrgsQuery();
  const updateUserMutation = useUpdateUserMutation();
  const [submitting, setSubmitting] = useState(false);
  const { t } = useTranslation();

  const fields: FieldConfig[] = [
  { name: "first_name", label: t("first_name"), type: "text" },
  { name: "last_name", label: t("last_name"), type: "text" },
  { name: "display_name", label: t("display_name"), type: "text" },
  { name: "phone", label: t("phone"), type: "tel", placeholder: "+111239456789" },
  { name: "city", label: t("city"), type: "text" },
  { name: "address", label: t("address"), type: "text" },
  {
    name: "country_iso",
    label: t("country"),
    type: "custom",
    customComponent: CountryField,
  },
  {
    name: "org_id",
    label: t("organization"),
    type: "select",
    options:
      orgsResponse?.orgs?.map((org: any) => ({
        label: org.name,
        value: org.id,
      })) ?? [],
  },
];

  const defaultValues = {
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    display_name: user?.display_name || "",
    phone: user?.phone || "",
    city: user?.city || "",
    address: user?.address || "",
    org_id: user?.org_id ?? 0,
    country_iso: user?.country_iso || "",
  };

  const handleSubmit = async (values: z.infer<typeof schema>) => {
    setSubmitting(true);
    try {
      const orgId =
        typeof values.org_id === "string"
          ? parseInt(values.org_id, 10)
          : values.org_id;

      if (!orgId || orgId <= 0) {
        throw new Error(t("organization_id_required"));
      }

      if (values.phone && !values.phone.match(/^\+?[1-9]\d{1,14}$/)) {
        throw new Error(t("phone_invalid"));
      }

      const requestBody: any = {
        first_name: values.first_name,
        last_name: values.last_name,
        display_name: values.display_name,
        org_id: orgId,
        city: values.city,
      };

      if (values.phone) requestBody.phone = values.phone;
      if (values.address) requestBody.address = values.address;
      if (values.country_iso) requestBody.country_iso = values.country_iso;

      await updateUserMutation.mutateAsync({
        params: { path: { userID } },
        body: requestBody,
      });

      toaster.create({
        title: t("success"),
        description: t("users.new.success_description"),
        type: "success",
      });

      navigate({ to: `/workspace/users/view/${userID}` });
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.detail ||
        err?.message ||
        t("users.view.error");

      toaster.create({
        title: t("workspace.settings.error"),
        description: errorMsg,
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box p={6}>
      <Heading size="lg" mb={4}>
        {t("edit_profile")}
      </Heading>
      <DynamicForm
        schema={schema}
        fields={fields}
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        submitText={t("save_changes")}
        submitLoading={submitting}
      />
    </Box>
  );
}
