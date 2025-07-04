import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import { offlineManager } from "./utils/offlineManager";
import "./index.css";

// Initialize offline manager (this will register the service worker)
offlineManager;

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);
