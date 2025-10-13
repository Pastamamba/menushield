import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./auth/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import AppRoutes from "./routes/AppRoutes";
import { offlineManager } from "./utils/offlineManager";
import { queryClient } from "./utils/queryClient";
import { performanceMonitor, initWebVitals } from "./utils/performanceMonitor";
import "./index.css";

// Initialize performance monitoring
performanceMonitor.startTimer('App Bootstrap');
initWebVitals();

// Initialize offline manager (this will register the service worker)
offlineManager;

performanceMonitor.endTimer('App Bootstrap');

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider defaultLanguage="en" supportedLanguages={['en', 'fi', 'sv']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </BrowserRouter>
);
