import { Routes, Route, Navigate } from "react-router-dom";
import GuestMenu from "../components/GuestMenu";
import LoginPage from "../admin/LoginPage";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/menu" element={<GuestMenu />} />
      <Route path="/" element={<Navigate to="/menu" replace />} />
      <Route path="*" element={<Navigate to="/menu" replace />} />
    </Routes>
  );
};

export default AppRoutes;
