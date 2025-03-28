import { Box, Flex, List, ListItem } from "@chakra-ui/react";
import {
  IconDashboard,
  IconInbox,
  IconList,
  IconLogout,
  IconPlayerPlay,
  IconReport,
  IconSettings,
  IconUser,
  IconUsersGroup,
} from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";

export default function Sidebar() {
  const items = [
    { icon: <IconDashboard />, href: "/dashboard", text: "Dashboard" },
    { icon: <IconInbox />, href: "/test-cases/inbox", text: "Inbox" },
    { icon: <IconList />, href: "/projects", text: "Projects" },
    { icon: <IconPlayerPlay />, href: "/test-plans", text: "Test Plans" },
    { icon: <IconUsersGroup />, href: "/testers", text: "Testers" },
    { icon: <IconSettings />, href: "/integrations", text: "Integrations" },
    { icon: <IconReport />, href: "/reports", text: "Reports" },
    { icon: <IconUser />, href: "/users", text: "Users" },
    { icon: <IconLogout />, href: "/logout", text: "Logout" },
  ];

  const links = items.map((entry, idx) => (
    <Link to={entry.href} key={idx}>
      <ListItem
        key={idx}
        marginY={2}
        padding={"8px 16px"}
        borderRadius="12px"
        color="black"
        flex={"1"}
      >
        <Flex>
          <Box marginRight={2}>{entry.icon}</Box>
          <Box>{entry.text}</Box>
        </Flex>
      </ListItem>
    </Link>
  ));

  return <List padding={4}>{links}</List>;
}

