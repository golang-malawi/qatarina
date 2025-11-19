import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "@/routeTree.gen";
import { StrictMode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "./global.css";
import { AuthProvider } from "./context/user";
import { useAuth } from "./hooks/isLoggedIn";
import { Provider } from "./components/ui/provider";
import { Spinner } from "@chakra-ui/react";

import {ToastContainer} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


const queryClient = new QueryClient();

// Register things for typesafety
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter<typeof routeTree>>;
  }
}

// eslint-disable-next-line react-refresh/only-export-components
function InnerApp() {
  const auth = useAuth();

   if (!auth) {
    return <Spinner size="xl" />; // or a loading screen
  }

  const router = createRouter({
    routeTree,
    context: {
      queryClient,
      auth,
    },
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
  });

  return <RouterProvider router={router} />;
}

const rootElement = document.getElementById("root")!;

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <Provider>
          <AuthProvider>
            <InnerApp />
            <ToastContainer position="top-right" autoClose={3000} />
          </AuthProvider>
        </Provider>
      </QueryClientProvider>
    </StrictMode>
  );
}
