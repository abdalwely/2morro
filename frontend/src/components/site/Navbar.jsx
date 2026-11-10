import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api, { imgSrc } from "@/lib/api";
import { t, useLang } from "@/lib/i18n";
import { Languages } from "lucide-react";

function LangToggle({ className = "", testid }) {
  const { lang, setLang } = useLang();
  const next = lang === "en" ? "ar" : "en";
  return (
    <button
      onClick={() => setLang(next)}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-2 text-xs font-bold text-white transition-colors hover:border-aqua/60 hover:text-aqua ${className}`}
      aria-label={next === "en" ? "Switch to English" : "التبديل إلى العربية"}
      data-testid={testid}
    >
      <Languages className="h-4 w-4" />
      {next === "en" ? "English" : "العربية"}
    </button>
  );
}

const LINKS = [
  { to: "/", label: "الرئيسية" },
  { to: "/about", label: "من نحن" },
  { to: "/services", label: "خدماتنا" },
  { to: "/solutions", label: "حلولنا" },
  { to: "/projects", label: "مشاريعنا" },
  { to: "/methodology", label: "منهجية العمل" },
  { to: "/models", label: "نماذج التنفيذ" },
  { to: "/knowledge", label: "المعرفة" },
  { to: "/contact", label: "تواصل معنا" },
];

function Brand({ settings }) {
  return (
    <Link to="/" className="flex items-center gap-3" data-testid="navbar-brand-link">
      {settings?.logo_url ? (
        <img src={imgSrc(settings.logo_url)} alt={settings?.company_name || t("شعار الشركة")} className="h-10 w-10 rounded-lg object-cover" />
      ) : (
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-electric font-heading text-lg font-black text-white">
          2M
        </span>
      )}
      <span className="flex flex-col leading-tight">
        <span className="font-heading text-lg font-extrabold text-white">2Morro</span>
        <span className="text-[11px] font-medium tracking-wide text-aqua">TECHNOLOGY SOLUTIONS</span>
      </span>
    </Link>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: () => api.get("/settings").then((r) => r.data), staleTime: 5 * 60 * 1000 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <nav className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled || open ? "glass-nav border-b border-white/10 shadow-lg shadow-navy-900/30" : "bg-transparent"}`} data-testid="site-navbar">
      <div className="container-x flex h-18 items-center justify-between py-3">
        <Brand settings={settings} />

        <div className="hidden items-center gap-0 xl:flex">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              data-testid={`nav-link-${l.to.replace("/", "") || "home"}`}
              className={({ isActive }) =>
                `rounded-lg px-4 py-2 text-sm font-bold transition-colors duration-200 ${
                  isActive ? "text-aqua" : "text-slate-200 hover:text-white"
                }`
              }
            >
              {t(l.label)}
            </NavLink>
          ))}
          <LangToggle className="ms-2" testid="navbar-lang-toggle" />
          <Link to="/contact" className="btn-primary ms-2 !px-5 !py-2.5" data-testid="navbar-cta-button">
            {t("ابدأ مشروعك")}
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex items-center gap-2 xl:hidden">
        <LangToggle testid="navbar-mobile-lang-toggle" />
        <button
          className="rounded-lg p-2 text-white transition-colors hover:bg-white/10 xl:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? t("إغلاق القائمة") : t("فتح القائمة")}
          aria-expanded={open}
          data-testid="navbar-mobile-toggle"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        </div>
      </div>

      {open && (
        <div className="glass-nav border-t border-white/10 xl:hidden" data-testid="navbar-mobile-menu">
          <div className="container-x flex flex-col gap-1 py-4">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                data-testid={`nav-mobile-link-${l.to.replace("/", "") || "home"}`}
                className={({ isActive }) =>
                  `rounded-lg px-4 py-3 text-sm font-bold transition-colors ${isActive ? "bg-white/10 text-aqua" : "text-slate-200"}`
                }
              >
                {t(l.label)}
              </NavLink>
            ))}
            <Link to="/contact" className="btn-primary mt-2" data-testid="navbar-mobile-cta">
              {t("ابدأ مشروعك")}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
