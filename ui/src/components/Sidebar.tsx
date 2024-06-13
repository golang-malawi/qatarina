"use client";
import React from "react";
import { ListItem, List, Link } from "@chakra-ui/react";
export default function Sidebar() {

  var items = [
    { href: "/dashboard", text: 'Dashboard' },
    { href: "/projects", text: 'Projects' },
    { href: "/testcase", text: 'Test Cases' },
    { href: "/sessions", text: 'Sessions' },
    { href: "/testers", text: 'Testers' },
    { href: "/integrations", text: 'Integrations' },
    { href: "/reports", text: 'Reports' },
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
    <ListItem key={idx} marginY="16px">
      <Link
        bgColor="blue"
        padding={'8px 16px'}
        borderRadius="12px"
        color="white"
        href={entry.href}>
        {entry.text}
      </Link>
    </ListItem>
  ));

  return (
    <List>
      {links}
    </List>
  )
}