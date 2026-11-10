import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AdminAuthProvider, RequireAdmin, AdminOnly } from "@/context/AdminAuthContext";
import UsersAdmin from "@/pages/admin/UsersAdmin";
import BackupAdmin from "@/pages/admin/BackupAdmin";
import AppearanceAdmin from "@/pages/admin/AppearanceAdmin";
import { LanguageProvider } from "@/lib/i18n";
import { ThemeApplier } from "@/lib/theme";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Services from "@/pages/Services";
import ServiceDetail from "@/pages/ServiceDetail";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import Models from "@/pages/Models";
import Contact from "@/pages/Contact";
import NotFound from "@/pages/NotFound";
import AdminLogin from "@/pages/admin/Login";
import AdminLayout from "@/pages/admin/Layout";
import AdminDashboard from "@/pages/admin/Dashboard";
import ServicesAdmin from "@/pages/admin/ServicesAdmin";
import ProjectsAdmin from "@/pages/admin/ProjectsAdmin";
import ModelsAdmin from "@/pages/admin/ModelsAdmin";
import SettingsAdmin from "@/pages/admin/SettingsAdmin";
import ContentAdmin from "@/pages/admin/ContentAdmin";
import ContentListing from "@/pages/ContentListing";
import LegalPage from "@/pages/LegalPage";
import ContentDetail from "@/pages/ContentDetail";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <AdminAuthProvider>
      <ThemeApplier />
      <ScrollToTop />
      <LanguageProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:slug" element={<ServiceDetail />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:slug" element={<ProjectDetail />} />
        <Route path="/models" element={<Models />} />
        <Route path="/domains" element={<ContentListing type="domains" />} />
        <Route path="/domains/:slug" element={<ContentDetail type="domains" />} />
        <Route path="/solutions" element={<ContentListing type="solutions" />} />
        <Route path="/solutions/:slug" element={<ContentDetail type="solutions" />} />
        <Route path="/sectors" element={<ContentListing type="sectors" />} />
        <Route path="/sectors/:slug" element={<ContentDetail type="sectors" />} />
        <Route path="/technology" element={<ContentListing type="technology" />} />
        <Route path="/methodology" element={<ContentListing type="methodology" />} />
        <Route path="/knowledge" element={<ContentListing type="knowledge" />} />
        <Route path="/knowledge/:slug" element={<ContentDetail type="knowledge" />} />
        <Route path="/privacy" element={<LegalPage type="privacy" />} />
        <Route path="/terms" element={<LegalPage type="terms" />} />
        <Route path="/contact" element={<Contact />} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="services" element={<ServicesAdmin />} />
          <Route path="projects" element={<ProjectsAdmin />} />
          <Route path="models" element={<ModelsAdmin />} />
          <Route path="domains" element={<ContentAdmin entity="domains" />} />
          <Route path="solutions" element={<ContentAdmin entity="solutions" />} />
          <Route path="sectors" element={<ContentAdmin entity="sectors" />} />
          <Route path="project-categories" element={<ContentAdmin entity="project_categories" />} />
          <Route path="technologies" element={<ContentAdmin entity="technologies" />} />
          <Route path="methodology" element={<ContentAdmin entity="methodology_phases" />} />
          <Route path="articles" element={<ContentAdmin entity="articles" />} />
          <Route path="article-categories" element={<ContentAdmin entity="article_categories" />} />
          <Route path="settings" element={<SettingsAdmin />} />
          <Route path="appearance" element={<AdminOnly><AppearanceAdmin /></AdminOnly>} />
          <Route path="users" element={<AdminOnly><UsersAdmin /></AdminOnly>} />
          <Route path="backup" element={<AdminOnly><BackupAdmin /></AdminOnly>} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      </LanguageProvider>
    </AdminAuthProvider>
  );
}
