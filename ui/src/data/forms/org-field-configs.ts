import { createFieldConfig } from "@/components/form";
import { CountryField } from "./CountryField";

export const orgFields = [
  createFieldConfig("name", "Organization Name", "text", {
    placeholder: "Enter organization name", 
    helperText: "Choose a descriptive name for your organization",
  }),
  createFieldConfig("address", "Address", "text", {
    placeholder: "Enter address",
  }),
  {
    name: "country",
    label: "",
    type: "custom" as const,
    customComponent: CountryField,
    required: true,
  },
  createFieldConfig("github_url", "GitHub URL", "url", {
    placeholder: "Enter GitHub URL",
    helperText: "Optional",
    }),
    createFieldConfig("website_url", "Website URL", "url", {
    placeholder: "Enter website URL",
    helperText: "Optional",
  }),
];