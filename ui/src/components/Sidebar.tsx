"use client";
import { Box, Flex, List, ListItem } from "@chakra-ui/react";
import { IconDashboard, IconList, IconPlayerPlay, IconReport, IconSettings, IconTestPipe, IconUsersGroup } from "@tabler/icons-react";
import { Link } from 'react-router-dom';
export default function Sidebar() {

  var items = [
    { icon: <IconDashboard />, href: "/dashboard", text: 'Dashboard' },
    { icon: <IconList />, href: "/projects", text: 'Projects' },
    { icon: <IconTestPipe />, href: "/test-cases", text: 'Test Cases' },
    { icon: <IconPlayerPlay />, href: "/sessions", text: 'Sessions' },
    { icon: <IconUsersGroup />, href: "/testers", text: 'Testers' },
    { icon: <IconSettings />, href: "/integrations", text: 'Integrations' },
    { icon: <IconReport />, href: "/reports", text: 'Reports' },
    // <li>
    //   <Link href={"/reports"}>Account Info</Link>
    //   <ul>
    //     <li><Link href={"/team"}>Profile</Link></li>
    //     <li><Link href={"/team"}>Team</Link></li>
    //     <li><Link href={"/billing"}>Billing Info</Link></li>
    //     <li><Link href={"/settings"}>Settings</Link></li>
    //   </ul>
    // </li>
  ];

  const links = items.map((entry, idx) => (
    <Link to={entry.href} >
      <ListItem key={idx} marginY={2}
        // bgColor="blue.800"
        padding={'8px 16px'}
        borderRadius="12px"
        color="black"
        flex={'1'}>
        <Flex>
          <Box marginRight={2}>
            {entry.icon}
          </Box>
          <Box>
            {entry.text}
          </Box>
        </Flex>
      </ListItem>
    </Link>
  ));

  return (
    <List padding={4}>
      {links}
    </List>
  )
}