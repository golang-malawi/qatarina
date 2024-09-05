import { Link } from "react-router-dom";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>Home </h1>
      <ul>
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li><Link to="/projects">Projects</Link></li>
        <li><Link to="/testers">Testers</Link></li>
        <li><Link to="/test-cases">Test Cases</Link></li>
        <li><Link to="/test-runs">Test Runs</Link></li>
        <li><Link to="/reports">Reports</Link></li>
      </ul>
    </main>
  );
}
