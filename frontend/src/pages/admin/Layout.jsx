import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Briefcase, Boxes, Settings, LogOut, ExternalLink, Menu, X, Route, Users, Palette, DatabaseBackup, Layers, Lightbulb, Building2, Cpu, BookOpen, Workflow, Tags } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useSEO } from "@/hooks/useSEO";

const NAV = [
  { to: "/admin", label: "الرئيسية", icon: LayoutDashboard, end: true, testid: "admin-nav-dashboard" },
  { to: "/admin/services", label: "إدارة الخدمات", icon: Briefcase, testid: "admin-nav-services" },
  { to: "/admin/projects", label: "إدارة المشاريع", icon: Boxes, testid: "admin-nav-projects" },
  { to: "/admin/domains", label: "المجالات التقنية", icon: Layers, testid: "admin-nav-domains" },
  { to: "/admin/solutions", label: "الحلول المتكاملة", icon: Lightbulb, testid: "admin-nav-solutions" },
  { to: "/admin/sectors", label: "القطاعات", icon: Building2, testid: "admin-nav-sectors" },
  { to: "/admin/project-categories", label: "تصنيفات المشاريع", icon: Tags, testid: "admin-nav-project-categories" },
  { to: "/admin/technologies", label: "المنظومة التقنية", icon: Cpu, testid: "admin-nav-technologies" },
  { to: "/admin/methodology", label: "منهجية العمل", icon: Workflow, testid: "admin-nav-methodology" },
  { to: "/admin/models", label: "نماذج التنفيذ", icon: Route, testid: "admin-nav-models" },
  { to: "/admin/articles", label: "مركز المعرفة", icon: BookOpen, testid: "admin-nav-articles" },
  { to: "/admin/settings", label: "بيانات الشركة والنصوص", icon: Settings, testid: "admin-nav-settings" },
  { to: "/admin/appearance", label: "المظهر والألوان", icon: Palette, testid: "admin-nav-appearance", adminOnly: true },
  { to: "/admin/users", label: "المستخدمون", icon: Users, testid: "admin-nav-users", adminOnly: true },
  { to: "/admin/backup", label: "النسخ الاحتياطي", icon: DatabaseBackup, testid: "admin-nav-backup", adminOnly: true },
];

export default function AdminLayout() {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  useSEO({ title: "لوحة التحكم | 2Morro Technology Solutions", description: "منطقة إدارة محتوى الموقع وإعداداته.", robots: "noindex,nofollow" });

  useEffect(() => setOpen(false), [pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-slate-100" dir="rtl" data-testid="admin-layout">
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between bg-navy-900 px-4 lg:hidden" data-testid="admin-mobile-header">
        <span className="font-heading text-sm font-extrabold text-white">لوحة التحكم</span>
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-white hover:bg-white/10" aria-label="فتح القائمة" data-testid="admin-mobile-menu-button">
          <Menu className="h-5 w-5" />
        </button>
      </header>
      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} data-testid="admin-sidebar-backdrop" />}
      <aside className={`fixed inset-y-0 right-0 z-50 flex w-64 flex-col bg-navy-900 transition-transform duration-300 lg:translate-x-0 ${open ? "translate-x-0" : "translate-x-full"}`} data-testid="admin-sidebar">
        <button onClick={() => setOpen(false)} className="absolute end-3 top-4 rounded-lg p-1.5 text-slate-300 hover:bg-white/10 lg:hidden" aria-label="إغلاق القائمة" data-testid="admin-mobile-close-button">
          <X className="h-5 w-5" />
        </button>
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-electric font-heading text-sm font-black text-white">2M</span>
          <div className="leading-tight">
            <div className="font-heading text-sm font-extrabold text-white">لوحة التحكم</div>
            <div className="text-[10px] font-medium tracking-wide text-aqua">2MORRO TECHNOLOGY SOLUTIONS</div>
          </div>
        </div>

        <nav
          className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-4"
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(148, 163, 184, 0.55) transparent" }}
          data-testid="admin-sidebar-nav"
          aria-label="القائمة الرئيسية للوحة التحكم"
        >
          {NAV.filter((n) => !n.adminOnly || user?.role === "admin").map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              data-testid={n.testid}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors duration-200 ${
                  isActive ? "bg-electric text-white shadow-md shadow-electric/30" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <n.icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/10 p-4">
          <Link to="/" target="_blank" className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-300 transition-colors hover:bg-white/10 hover:text-aqua" data-testid="admin-view-site-link">
            <ExternalLink className="h-[18px] w-[18px]" />
            معاينة الموقع
          </Link>
          <button
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-bold text-red-400 transition-colors hover:bg-red-500/10"
            data-testid="admin-logout-button"
          >
            <LogOut className="h-[18px] w-[18px]" />
            تسجيل الخروج
          </button>
          <div className="mt-2 rounded-lg bg-white/5 p-3 text-xs text-slate-400" data-testid="admin-current-user">
            <span className="block font-bold text-slate-200">{user?.name || "Admin"} <span className="text-[10px] font-medium text-aqua" data-testid="admin-user-role-badge">{user?.role === "admin" ? "مدير" : "محرر"}</span></span>
            <span dir="ltr" className="block truncate">{user?.email || ""}</span>
          </div>
        </div>
      </aside>

      <main className="min-h-screen w-full min-w-0 flex-1 pt-14 lg:ps-64 lg:pt-0">
        <div className="p-4 sm:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
