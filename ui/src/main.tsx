import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { Providers } from "./app/providers.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Providers>
      <Suspense fallback={<div>Loading...</div>}>
        <App />
      </Suspense>
    </Providers>
  </React.StrictMode>,
);
