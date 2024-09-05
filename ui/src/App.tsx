import {
  createBrowserRouter,
  createRoutesFromElements,
  Outlet,
  Route,
  RouterProvider
} from "react-router-dom";
import './App.css';
import AuthLayout from "./app/AuthLayout";
import DashboardPage from "./app/dashboard";
import Home from "./app/Home";
import LoginPage from "./app/login";
import ProjectPage from "./app/projects";


function Root({ }) {
  return (
    <Outlet />
  )
}

function App() {
  return (
    <RouterProvider router={// Configure nested routes with JSX
      createBrowserRouter(
        createRoutesFromElements(
          <Route path="/" element={<Root />}>
            <Route path="" element={<Home />} />
            <Route path="projects" element={<ProjectPage />} />
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
