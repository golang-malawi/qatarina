import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider
} from "react-router-dom";
import './App.css';
import AuthLayout from "./app/AuthLayout";
import DashboardPage from "./app/dashboard";
import Home from "./app/Home";
import Root from "./app/Layout";
import LoginPage from "./app/login";
import ProjectPage from "./app/projects";
import CreateProject from "./app/projects/CreateProject";
import ExecuteTestPlan from "./app/projects/ExecuteTestPlan";
import TestCasePage from "./app/testcase";
import CreateTestCase from "./app/testcase/new";


function App() {
  return (
    <RouterProvider router={// Configure nested routes with JSX
      createBrowserRouter(
        createRoutesFromElements(
          <Route path="/" element={<Root />}>
            <Route path="" element={<Home />} />
            <Route path="projects" element={<ProjectPage />} />
            <Route path="/projects/new" element={<CreateProject />} />
            <Route path="/projects/:projectID/test-cases/new" element={<CreateTestCase />} />
            <Route path="/projects/:projectID/test-plan/execute" element={<ExecuteTestPlan />} />
            <Route path="test-cases" element={<TestCasePage />} />
            <Route
              path="dashboard"
              element={<DashboardPage />}
            />
            <Route element={<AuthLayout />}>
              <Route
                path="login"
                element={<LoginPage />}
              // loader={redirectIfUser}
              />
              {/* <Route path="logout" action={logoutUser} /> */}
            </Route>
          </Route>
        )
      )} />
  )
}

export default App
