import {
  FiHome,
  FiFolder,
  FiUsers,
  FiUser,
  FiLogOut,
  FiSettings,
  FiDatabase,
  FiInbox,
  FiFileText,
  FiList,
} from "react-icons/fi";
import { IconType } from "react-icons";
import { Route as ProjectOverviewRoute } from "@/routes/(project)/projects/$projectId/overview";

export interface NavItem {
  name: string;
  icon: IconType;
  path: string;
  children?: NavItem[];
}

// The Inbox is a tester's main place of work, so the sidebar pins it at the top
// in every context (workspace and project) instead of listing it with the other links.
export const InboxLinkItem: NavItem = {
  path: "/workspace/test-cases/inbox",
  name: "Inbox",
  icon: FiInbox,
};

export const MainLinkItems: NavItem[] = [
  { path: "/workspace/dashboard", name: "Dashboard", icon: FiHome },
  { path: "/workspace/projects", name: "Projects", icon: FiFolder },
  { path: "/workspace/organizations", name: "Organizations", icon: FiDatabase },
  { path: "/workspace/testers", name: "Testers", icon: FiUsers },
  { path: "/workspace/users", name: "Users", icon: FiUser },
  { path: "/workspace/settings", name: "Settings", icon: FiSettings },
  { path: "/logout", name: "Logout", icon: FiLogOut },
];

// Project‑level links
export const ProjectLinkItems: NavItem[] = [
  { path: ProjectOverviewRoute.to, name: "Overview", icon: FiHome }, 
  { path: "/projects/$projectId/test-cases", name: "Test Cases", icon: FiFileText },
  { path: "/projects/$projectId/test-plans", name: "Test Plans", icon: FiList },
  { path: "/projects/$projectId/features", name: "Features/Modules", icon: FiDatabase },
  { path: "/projects/$projectId/testers", name: "Testers", icon: FiUsers },
  { path: "/projects/$projectId/reports", name: "Reports", icon: FiFileText },
  { path: "/projects/$projectId/insights", name: "Insights", icon: FiFileText },
  { path: "/projects/$projectId/environments", name: "Environments", icon: FiDatabase },
  { path: "/projects/$projectId/documents", name: "Documents", icon: FiFileText },
  { path: "/projects/$projectId/settings", name: "Settings", icon: FiSettings },
];