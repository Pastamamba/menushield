// src/routes/AppRoutes.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import GuestMenu from "../components/GuestMenu";
import LoginPage from "../admin/LoginPage";
import SignupPage from "../admin/SignupPage";
import AdminMenu from "../admin/AdminMenu";
import {
  ProtectedRoute,
  PublicOnlyRoute,
  GuestRoute,
} from "../components/RouteGuard";
import ErrorBoundary, {
  MenuErrorBoundary,
  AdminErrorBoundary,
} from "../components/ErrorBoundary";

export default function AppRoutes() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Guest side - protected from admin interference */}
        <Route
          path="/"
          element={
            <GuestRoute>
              <MenuErrorBoundary>
                <GuestMenu />
              </MenuErrorBoundary>
            </GuestRoute>
          }
        />
        <Route
          path="/menu"
          element={
            <GuestRoute>
              <MenuErrorBoundary>
                <GuestMenu />
              </MenuErrorBoundary>
            </GuestRoute>
          }
        />
        <Route
          path="/m/:restaurantId"
          element={
            <GuestRoute>
              <MenuErrorBoundary>
                <GuestMenu />
              </MenuErrorBoundary>
            </GuestRoute>
          }
        />

        {/* Admin side - public auth routes */}
        <Route
          path="/admin/login"
          element={
            <PublicOnlyRoute>
              <AdminErrorBoundary>
                <LoginPage />
              </AdminErrorBoundary>
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/admin/signup"
          element={
            <PublicOnlyRoute>
              <AdminErrorBoundary>
                <SignupPage />
              </AdminErrorBoundary>
            </PublicOnlyRoute>
          }
        />

        {/* Admin side - protected routes */}
        <Route
          path="/admin/menu"
          element={
            <ProtectedRoute>
              <AdminErrorBoundary>
                <AdminMenu />
              </AdminErrorBoundary>
            </ProtectedRoute>
          }
        />

        {/* catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
