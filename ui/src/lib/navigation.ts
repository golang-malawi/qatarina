import {
  FiHome,
  FiInbox,
  FiFolder,
  FiUsers,
  FiUser,
  FiLogOut,
  FiSettings,
  FiDatabase,
} from "react-icons/fi";
import { IconType } from "react-icons";

export interface NavItem {
  name: string;
  icon: IconType;
  path: string;
  children?: NavItem[];
}

export const MainLinkItems: NavItem[] = [
  { path: "/dashboard", name: "Dashboard", icon: FiHome },
  { path: "/test-cases/inbox", name: "Inbox", icon: FiInbox },
  { path: "/projects", name: "Projects", icon: FiFolder },
  {path: "/orgs", name: "Organizations", icon: FiDatabase},
  { path: "/testers", name: "Testers", icon: FiUsers },
  { path: "/users", name: "Users", icon: FiUser },
  { path: "/settings", name: "Settings", icon: FiSettings },
  { path: "/logout", name: "Logout", icon: FiLogOut },
];
