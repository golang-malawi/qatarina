import { useEffect } from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  useNavigate,
} from "react-router-dom";
import DashboardPage from "../app/dashboard";
import Home from "../app/Home";
import ListIntegrations from "../app/integrations/ListIntegrations";
import Root from "../app/Layout";
import LoginPage from "../app/login";
import ProjectPage from "../app/projects";
import CreateProject from "../app/projects/CreateProject";
import ExecuteTestPlan from "../app/projects/ExecuteTestPlan";
import ListReports from "../app/reports/ListReports";
import TestCasePage from "../app/testcase";
import TestCaseInbox from "../app/testcase/inbox";
import TestCaseInboxItem from "../app/testcase/inbox-item";
import CreateTestCase from "../app/testcase/new";
import ListTesters from "../app/testers/ListTesters";
import CreateNewTestPlan from "../app/testplans/CreateNewTestPlan";
import ListTestPlans from "../app/testplans/ListTestPlans";
import ListUsers from "../app/users";
import CreateNewUser from "../app/users/CreateNewUser";
import ViewUserProfile from "../app/users/ViewUserProfile";

function Logout() {
  const redirect = useNavigate();
  useEffect(() => {
    localStorage.removeItem("auth.user_id");
    localStorage.removeItem("auth.displayName");
    localStorage.removeItem("auth.token");
    redirect("/login");
  }, []);

  return <></>;
}

function appRouter() {
  return createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<Root />}>
        <Route path="" element={<Home />} />
        <Route path="users" element={<ListUsers />} />
        <Route path="users/new" element={<CreateNewUser />} />
        <Route path="users/view/:userID" element={<ViewUserProfile />} />
        <Route path="projects" element={<ProjectPage />} />
        <Route path="/projects/new" element={<CreateProject />} />
        <Route
          path="/projects/:projectID/test-cases/new"
          element={<CreateTestCase />}
        />
        <Route
          path="/projects/:projectID/test-plans/new"
          element={<CreateNewTestPlan />}
        />
        <Route
          path="/projects/:projectID/test-plans/execute"
          element={<ExecuteTestPlan />}
        />
        <Route path="test-cases" element={<TestCasePage />} />
        <Route path="test-cases/new" element={<CreateTestCase />} />
        <Route
          path="test-cases/inbox"
          element={<TestCaseInbox />}
          children={[
            <Route path="view/:testCaseId" element={<TestCaseInboxItem />} />,
          ]}
        />

        <Route path="testers" element={<ListTesters />} />
        <Route path="integrations" element={<ListIntegrations />} />
        <Route path="test-plans" element={<ListTestPlans />} />
        <Route path="reports" element={<ListReports />} />
        <Route path="users" element={<ListUsers />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route
          path="login"
          element={<LoginPage />}
          // loader={redirectIfUser}
        />
        <Route path="logout" element={<Logout />} />
      </Route>,
    ),
  );
}

const router = appRouter();

export default router;
