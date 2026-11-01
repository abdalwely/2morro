import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Mail, MessageCircle, Linkedin, Twitter, Instagram, Github } from "lucide-react";
import api, { imgSrc, waLink } from "@/lib/api";
import { t, tr, getLang } from "@/lib/i18n";

const QUICK_LINKS = [
  { to: "/", label: "الرئيسية" },
  { to: "/about", label: "من نحن" },
  { to: "/services", label: "خدماتنا" },
  { to: "/projects", label: "مشاريعنا" },
  { to: "/models", label: "نماذج التنفيذ" },
  { to: "/contact", label: "تواصل معنا" },
];

const SOCIALS = [
  { key: "linkedin", icon: Linkedin, label: "لينكدإن" },
  { key: "twitter", icon: Twitter, label: "إكس (تويتر)" },
  { key: "instagram", icon: Instagram, label: "إنستغرام" },
  { key: "github", icon: Github, label: "جيت هب" },
];

export default function Footer() {
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: () => api.get("/settings").then((r) => r.data), staleTime: 5 * 60 * 1000 });
  const { data: services } = useQuery({ queryKey: ["services"], queryFn: () => api.get("/services").then((r) => r.data), staleTime: 5 * 60 * 1000 });
  const socialEntries = Object.entries(settings?.social || {}).filter(([, v]) => v);
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy-900 text-slate-300" data-testid="site-footer">
      <div className="container-x grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        <div>
          <div className="flex items-center gap-3">
            {settings?.logo_url ? (
              <img src={imgSrc(settings.logo_url)} alt={settings?.company_name || t("شعار الشركة")} className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-electric font-heading text-lg font-black text-white">2M</span>
            )}
            <div className="leading-tight">
              <div className="font-heading text-lg font-extrabold text-white">2Morro</div>
              <div className="text-[11px] font-medium tracking-wide text-aqua">TECHNICALLY SOLUTIONS</div>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">{tr(settings, "footer_text") || ""}</p>
        </div>

        <div>
          <h3 className="font-heading text-base font-bold text-white">{t("روابط سريعة")}</h3>
          <ul className="mt-4 space-y-2.5">
            {QUICK_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-sm transition-colors hover:text-aqua" data-testid={`footer-link-${l.to.replace("/", "") || "home"}`}>
                  {t(l.label)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-heading text-base font-bold text-white">{t("خدماتنا")}</h3>
          <ul className="mt-4 space-y-2.5">
            {(services || []).slice(0, 5).map((s) => (
              <li key={s.id}>
                <Link to={`/services/${s.slug}`} className="text-sm transition-colors hover:text-aqua" data-testid={`footer-service-${s.id}`}>
                  {tr(s, "name")}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-heading text-base font-bold text-white">{t("تواصل معنا")}</h3>
          <div className="mt-4 space-y-3">
            {settings?.email && (
              <a href={`mailto:${settings.email}`} className="flex items-center gap-2 text-sm transition-colors hover:text-aqua" data-testid="footer-email-link">
                <Mail className="h-4 w-4 text-aqua" />
                <span dir="ltr">{settings.email}</span>
              </a>
            )}
            {settings?.whatsapp_number && (
              <a href={waLink(settings.whatsapp_number)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm transition-colors hover:text-aqua" data-testid="footer-whatsapp-link">
                <MessageCircle className="h-4 w-4 text-aqua" />
                <span dir="ltr">{settings.whatsapp_number}</span>
              </a>
            )}
            {!settings?.email && !settings?.whatsapp_number && (
              <p className="text-sm text-slate-500">{t("لم تُضف بيانات التواصل بعد — يمكن للمسؤول إضافتها من لوحة التحكم.")}</p>
            )}
            {socialEntries.length > 0 && (
              <div className="flex gap-2 pt-2">
                {socialEntries.map(([key, url]) => {
                  const s = SOCIALS.find((x) => x.key === key);
                  if (!s || !url) return null;
                  const Icon = s.icon;
                  return (
                    <a key={key} href={url} target="_blank" rel="noopener noreferrer" aria-label={t(s.label)} title={t(s.label)} className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 transition-all hover:border-aqua/40 hover:text-aqua" data-testid={`footer-social-${key}`}>
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-slate-500 sm:flex-row">
          <span data-testid="footer-copyright">{(getLang() === "en" ? settings?.copyright_text_en : settings?.copyright_text) || `© ${year} ${settings?.company_name || "2Morro Technically Solutions"} — ${t("جميع الحقوق محفوظة")}`}</span>
          <Link to="/admin" className="transition-colors hover:text-aqua" data-testid="footer-admin-link">
            {t("لوحة التحكم الإدارية")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
