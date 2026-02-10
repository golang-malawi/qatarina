import { createFileRoute } from "@tanstack/react-router";
import { Badge, Box, Heading, Stack, Text } from "@chakra-ui/react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";

export const Route = createFileRoute("/ui/table-demo/")({
  component: TableDemoPage,
});

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Invited" | "Suspended";
  lastSeen: string;
};

const data: TeamMember[] = [
  {
    id: "TM-001",
    name: "Amara Kunda",
    email: "amara.kunda@qatarina.io",
    role: "QA Lead",
    status: "Active",
    lastSeen: "Today",
  },
  {
    id: "TM-002",
    name: "Jonas Tembo",
    email: "jonas.tembo@qatarina.io",
    role: "Test Engineer",
    status: "Active",
    lastSeen: "Yesterday",
  },
  {
    id: "TM-003",
    name: "Lina Mwale",
    email: "lina.mwale@qatarina.io",
    role: "Product",
    status: "Invited",
    lastSeen: "--",
  },
  {
    id: "TM-004",
    name: "Grace Chirwa",
    email: "grace.chirwa@qatarina.io",
    role: "Automation",
    status: "Suspended",
    lastSeen: "2 weeks ago",
  },
  {
    id: "TM-005",
    name: "David Banda",
    email: "david.banda@qatarina.io",
    role: "Test Engineer",
    status: "Active",
    lastSeen: "3 hours ago",
  },
  {
    id: "TM-006",
    name: "Luka Phiri",
    email: "luka.phiri@qatarina.io",
    role: "QA Analyst",
    status: "Active",
    lastSeen: "Today",
  },
  {
    id: "TM-007",
    name: "Martha Zulu",
    email: "martha.zulu@qatarina.io",
    role: "Design",
    status: "Invited",
    lastSeen: "--",
  },
  {
    id: "TM-008",
    name: "Kelvin Nkhoma",
    email: "kelvin.nkhoma@qatarina.io",
    role: "Test Engineer",
    status: "Active",
    lastSeen: "1 day ago",
  },
  {
    id: "TM-009",
    name: "Ivy Ngoma",
    email: "ivy.ngoma@qatarina.io",
    role: "QA Lead",
    status: "Active",
    lastSeen: "4 hours ago",
  },
  {
    id: "TM-010",
    name: "Brian Phiri",
    email: "brian.phiri@qatarina.io",
    role: "Automation",
    status: "Active",
    lastSeen: "Today",
  },
  {
    id: "TM-011",
    name: "Sasha Moyo",
    email: "sasha.moyo@qatarina.io",
    role: "Product",
    status: "Invited",
    lastSeen: "--",
  },
  {
    id: "TM-012",
    name: "Peter Kunda",
    email: "peter.kunda@qatarina.io",
    role: "Test Engineer",
    status: "Active",
    lastSeen: "Yesterday",
  },
];

const columns: ColumnDef<TeamMember>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: (info) => (
      <Text fontWeight="medium" color="fg.heading">
        {info.getValue<string>()}
      </Text>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: (info) => (
      <Text fontSize="sm" color="fg.muted">
        {info.getValue<string>()}
      </Text>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: (info) => {
      const status = info.getValue<TeamMember["status"]>();
      const colorPalette =
        status === "Active"
          ? "green"
          : status === "Invited"
          ? "blue"
          : "red";
      return (
        <Badge variant="subtle" colorPalette={colorPalette}>
          {status}
        </Badge>
      );
    },
    meta: { align: "center", width: "120px" },
  },
  {
    accessorKey: "lastSeen",
    header: "Last Seen",
    meta: { align: "end", width: "140px" },
  },
];

function TableDemoPage() {
  return (
    <Stack gap="6">
      <Box>
        <Heading size="lg" color="fg.heading">
          Reusable Data Table
        </Heading>
        <Text color="fg.subtle" mt="2">
          A TanStack Table wrapper styled with Chakra UI and ready for reuse.
        </Text>
      </Box>
      <DataTable
        data={data}
        columns={columns}
        showGlobalFilter
        filterPlaceholder="Search team members"
      />
    </Stack>
  );
}
