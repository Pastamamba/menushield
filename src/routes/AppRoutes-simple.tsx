// src/routes/AppRoutes.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import GuestMenu from "../components/GuestMenu";
import LoginPage from "../admin/LoginPage";
import SignupPage from "../admin/SignupPage";
import AdminMenu from "../admin/AdminMenu";
import { RouteGuard } from "../components/RouteGuard";
import { ErrorBoundary } from "../components/ErrorBoundary";

export default function AppRoutes() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/menu" element={<GuestMenu />} />
        <Route path="/menu/:restaurantId" element={<GuestMenu />} />
        
        {/* Protected admin routes */}
        <Route 
          path="/admin" 
          element={
            <RouteGuard>
              <AdminMenu />
            </RouteGuard>
          } 
        />
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/menu" replace />} />
        <Route path="*" element={<Navigate to="/menu" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
