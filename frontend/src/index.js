import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import "@/index.css";
import App from "@/App";
import { bootTheme } from "@/lib/theme";

bootTheme();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster position="top-center" dir="rtl" richColors closeButton toastOptions={{ style: { fontFamily: "'IBM Plex Sans Arabic', Tajawal, sans-serif" } }} />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
