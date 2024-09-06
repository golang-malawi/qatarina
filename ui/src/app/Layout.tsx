import { Box, Flex, Heading } from "@chakra-ui/react";
import { IconDashboard, IconList, IconPlayerPlay, IconReport, IconSettings, IconTestPipe, IconUsersGroup } from "@tabler/icons-react";
import { Link, Outlet } from "react-router-dom";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Box width={'100%'} bg={'gray.50'} borderBottom={'1px solid #f3f3f3'} padding={4}>
        <Link to="/">
          <Heading size='1xl'>QATARINA </Heading>
        </Link>
      </Box>
      <Flex>
        <Box w="20%" borderRight={'1px solid rgba(200, 200, 200, 1)'} h="100vh">
          <ul>
            <li><Link to="/dashboard"><IconDashboard /> Dashboard</Link></li>
            <li><Link to="/projects"><IconList /> Projects</Link></li>
            <li><Link to="/testers"><IconUsersGroup /> Testers</Link></li>
            <li><Link to="/test-cases"><IconTestPipe /> Test Cases</Link></li>
            <li><Link to="/test-runs"><IconPlayerPlay /> Test Runs</Link></li>
            <li><Link to="/reports"><IconReport /> Reports</Link></li>
            <li><Link to="/insights"><IconSettings /> Settings</Link></li>
          </ul>
        </Box>
        <Box padding={4}>
          <Outlet />
        </Box>
      </Flex>
    </main>
  );
}
