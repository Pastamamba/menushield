import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./auth/AuthContext";
import { RestaurantProvider } from "./contexts/RestaurantContext";
import AppRoutes from "./routes/AppRoutes";
import { offlineManager } from "./utils/offlineManager";
import { queryClient } from "./utils/queryClient";
import "./index.css";

// Initialize offline manager (this will register the service worker)
offlineManager;

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RestaurantProvider>
          <AppRoutes />
        </RestaurantProvider>
      </AuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
);
