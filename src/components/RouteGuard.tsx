import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireNoAuth?: boolean;
  adminOnly?: boolean;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requireAuth = false,
  requireNoAuth = false,
  adminOnly = false,
}) => {
  const { token } = useAuth();
  const location = useLocation();
  const isAuthenticated = !!token;

  // Redirect authenticated users away from auth pages
  if (requireNoAuth && isAuthenticated) {
    const redirect = new URLSearchParams(location.search).get("redirect");
    return <Navigate to={redirect || "/admin/menu"} replace />;
  }

  // Redirect unauthenticated users to login
  if (requireAuth && !isAuthenticated) {
    const redirectPath = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/admin/login?redirect=${encodeURIComponent(redirectPath)}`}
        replace
      />
    );
  }

  // Admin-only routes
  if (adminOnly && !isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

// Convenience components
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <RouteGuard requireAuth adminOnly>
    {children}
  </RouteGuard>
);

export const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <RouteGuard requireNoAuth>{children}</RouteGuard>;

export const GuestRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <RouteGuard>{children}</RouteGuard>;
