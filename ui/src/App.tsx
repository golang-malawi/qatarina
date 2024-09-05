import {
  createBrowserRouter,
  createRoutesFromElements,
  Outlet,
  Route,
  RouterProvider
} from "react-router-dom";
import './App.css';
import DashboardPage from "./app/dashboard";
import Home from "./app/Home";
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
            {/* <Route element={<AuthLayout />}>
                <Route
                  path="login"
                  element={<Login />}
                  loader={redirectIfUser}
                />
                <Route path="logout" action={logoutUser} />
              </Route> */}
          </Route>
        )
      )} />
  )
}

export default App
