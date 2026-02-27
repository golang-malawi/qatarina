import { createFileRoute, useNavigate } from "@tanstack/react-router";
import z from "zod";
import { useGetUserQuery, useUpdateUserMutation } from "@/services/UserService";
import { DynamicForm, FieldConfig } from "@/components/form";
import { Box, Heading } from "@chakra-ui/react";
import {toaster} from "@/components/ui/toaster";
import { useState } from "react"; 
import { useOrgsQuery } from "@/services/OrgsService";

export const Route = createFileRoute("/(app)/users/$userID/edit")({
  component: EditUserProfile,
});

const schema = z.object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    display_name: z.string().min(1, "Display name is required"),
    phone: z.string().optional().default(""),
    org_id: z.union([z.number().int().positive("Organization ID is required"), z.string().transform(Number)])
      .pipe(z.number().int().positive("Organization ID is required")),
    city: z.string().min(1, "City is required"),
    address: z.string().optional().default(""),
    country_iso: z.string().optional().default(""),
});

function EditUserProfile() {
  const { userID } = Route.useParams();
  const navigate = useNavigate();
  const {data: user} = useGetUserQuery(userID);
  const { data: orgsResponse} = useOrgsQuery();
  const updateUserMutation = useUpdateUserMutation();
  const [submitting, setSubmitting] = useState(false);

    const fields: FieldConfig[] = [
        { name: "first_name", label: "First Name", type: "text" },
        { name: "last_name", label: "Last Name", type: "text" },
        { name: "display_name", label: "Display Name", type: "text" },
        { name: "phone", label: "Phone", type: "tel", placeholder: "+111239456789" },
        { name: "city", label: "City", type: "text" },
        { name: "address", label: "Address", type: "text" },
        { name: "country_iso", label: "Country ISO (Optional)", type: "text", placeholder: "e.g. MW, US, GB" },
        { name: "org_id", 
          label: "Organization", 
          type: "select",
          options: orgsResponse?.orgs?.map((org: any) => ({ 
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
    try{
      const orgId = typeof values.org_id === 'string' ? parseInt(values.org_id, 10) : values.org_id;
      
      if (!orgId || orgId <= 0) {
        throw new Error("Organization ID must be a valid positive number");
      }

      if (values.phone && !values.phone.match(/^\+?[1-9]\d{1,14}$/)) {
        throw new Error("Phone number must be in valid format (e.g. +11123456789)");
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

      console.log("Submitting user update with:", requestBody);

      const result = await updateUserMutation.mutateAsync({
        params: { path: { userID } },
        body: requestBody,
      });

      console.log("Update successful:", result);

      toaster.create({
        title: "Success",
        description: "Profile updated successfully",
        type: "success",
      });
      navigate({ to: `/users/view/${userID}` });
    } catch (err: any) {
      console.error("Update failed:", err);
      const errorMsg = err?.response?.data?.detail || err?.message || "Invalid data in request. Please check inputs.";
      toaster.create({
        title: "Error",
        description: errorMsg,
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box p={6}>
        <Heading size="lg" mb={4}>Edit Profile</Heading>
        <DynamicForm
            schema={schema}
            fields={fields}
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            submitText="Save Changes"
            submitLoading={submitting}
        />
    </Box>
    );
}