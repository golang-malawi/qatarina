import {
  FiHome,
  FiInbox,
  FiFolder,
  FiClipboard,
  FiUsers,
  FiLink,
  FiBarChart2,
  FiUser,
  FiLogOut,
  FiSettings,
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
  { path: "/testers", name: "Testers", icon: FiUsers },
  // TODO(zikani03): { path: "/integrations", name: "Integrations", icon: FiLink },
  // TODO(zikani03): { path: "/reports", name: "Reports", icon: FiBarChart2 },
  { path: "/users", name: "Users", icon: FiUser },
  { path: "/settings", name: "Settings", icon: FiSettings },
  { path: "/logout", name: "Logout", icon: FiLogOut },
];
