// src/routes/AppRoutes.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import GuestMenu from "../components/GuestMenu";
import LoginPage from "../admin/LoginPage";
import SignupPage from "../admin/SignupPage";
import AdminMenu from "../admin/AdminMenu";
import { RouteGuard } from "../components/RouteGuard";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { RestaurantLayout } from "../components/RestaurantLayout";

export default function AppRoutes() {
  
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public restaurant menu routes - NEW URL STRUCTURE */}
        <Route path="/r/:restaurantSlug" element={
          <RestaurantLayout>
            <GuestMenu />
          </RestaurantLayout>
        } />
        <Route path="/r/:restaurantSlug/menu" element={
          <RestaurantLayout>
            <GuestMenu />
          </RestaurantLayout>
        } />
        <Route path="/restaurant/:restaurantSlug" element={
          <RestaurantLayout>
            <GuestMenu />
          </RestaurantLayout>
        } />
        <Route path="/restaurant/:restaurantSlug/menu" element={
          <RestaurantLayout>
            <GuestMenu />
          </RestaurantLayout>
        } />
        
        {/* Legacy routes - redirect to new structure */}
        <Route path="/menu" element={<Navigate to="/" replace />} />
        <Route path="/menu/:restaurantId" element={<Navigate to="/" replace />} />
        
        {/* Authentication routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        
        {/* Protected admin routes - restaurant-specific */}
        <Route 
          path="/r/:restaurantSlug/admin" 
          element={
            <RestaurantLayout>
              <RouteGuard requireAuth adminOnly>
                <AdminMenu />
              </RouteGuard>
            </RestaurantLayout>
          } 
        />
        <Route 
          path="/r/:restaurantSlug/admin/:section" 
          element={
            <RestaurantLayout>
              <RouteGuard requireAuth adminOnly>
                <AdminMenu />
              </RouteGuard>
            </RestaurantLayout>
          } 
        />
        
        {/* Legacy admin routes - redirect to restaurant-specific */}
        <Route 
          path="/admin" 
          element={
            <RouteGuard requireAuth adminOnly>
              <AdminMenu />
            </RouteGuard>
          } 
        />
        <Route 
          path="/admin/menu" 
          element={
            <RouteGuard requireAuth adminOnly>
              <AdminMenu />
            </RouteGuard>
          } 
        />
        
        {/* Default redirect to demo restaurant or restaurant selection */}
        <Route path="/" element={<Navigate to="/r/demo-restaurant" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
