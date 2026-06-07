import { Routes, Route } from "react-router-dom";
import PublicLayout from "./layout/PublicLayout";
import HomePage from "./pages/HomePage";
import RepositoryPage from "./pages/RepositoryPage";
import AboutPage from "./pages/AboutPage";
import AppDetailPage from "./pages/AppDetailPage";
import LoginPage from "./pages/admin/LoginPage";
import DashboardPage from "./pages/admin/DashboardPage";

export default function App() {
  return (
    <Routes>
      {/* Public routes with shared layout */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/repository" element={<RepositoryPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/app" element={<AppDetailPage />} />
      </Route>

      {/* Admin routes (standalone layouts) */}
      <Route path="/admin" element={<LoginPage />} />
      <Route path="/admin/dashboard" element={<DashboardPage />} />
    </Routes>
  );
}
