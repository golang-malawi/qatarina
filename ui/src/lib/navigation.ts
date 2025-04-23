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
  { path: "/test-plans", name: "Test Plans", icon: FiClipboard },
  { path: "/testers", name: "Testers", icon: FiUsers },
  { path: "/integrations", name: "Integrations", icon: FiLink },
  { path: "/reports", name: "Reports", icon: FiBarChart2 },
  { path: "/users", name: "Users", icon: FiUser },
  { path: "/logout", name: "Logout", icon: FiLogOut },
];
