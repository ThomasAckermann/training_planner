import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1a1a1a",
              color: "#f0f0f0",
              border: "1px solid #333333",
            },
            success: {
              iconTheme: {
                primary: "#ffffff",
                secondary: "#1a1a1a",
              },
            },
            error: {
              iconTheme: {
                primary: "#ff3333",
                secondary: "#1a1a1a",
              },
            },
          }}
        />
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
