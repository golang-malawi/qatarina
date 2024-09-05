import { IconDashboard, IconList, IconPlayerPlay, IconReport, IconSettings, IconTestPipe, IconUsersGroup } from "@tabler/icons-react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>Home </h1>
      <ul>
        <li><Link to="/dashboard"><IconDashboard /> Dashboard</Link></li>
        <li><Link to="/projects"><IconList /> Projects</Link></li>
        <li><Link to="/testers"><IconUsersGroup /> Testers</Link></li>
        <li><Link to="/test-cases"><IconTestPipe /> Test Cases</Link></li>
        <li><Link to="/test-runs"><IconPlayerPlay /> Test Runs</Link></li>
        <li><Link to="/reports"><IconReport /> Reports</Link></li>
        <li><Link to="/insights"><IconSettings /> Settings</Link></li>
      </ul>
    </main>
  );
}
