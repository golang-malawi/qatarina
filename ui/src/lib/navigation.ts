import {
  FiHome,
  FiFolder,
  FiUsers,
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
  { path: "/workspace/dashboard", name: "Dashboard", icon: FiHome },
  { path: "/workspace/projects", name: "Projects", icon: FiFolder },
  { path: "/workspace/testers", name: "Testers", icon: FiUsers },
  { path: "/workspace/users", name: "Users", icon: FiUser },
  { path: "/workspace/settings", name: "Settings", icon: FiSettings },
  { path: "/logout", name: "Logout", icon: FiLogOut },
];
