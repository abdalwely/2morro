import { Link } from "react-router-dom";
import { ChevronLeft, ArrowLeft, MessageCircle, Mail, Info } from "lucide-react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { LoadingBlock } from "@/components/site/Shared";
import { t } from "@/lib/i18n";

export function DetailLoading() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-32"><LoadingBlock /></div>
    </div>
  );
}

export function DetailNotFound({ testid, title, text, to, backLabel, backTestid }) {
  return (
    <div className="min-h-screen" data-testid={testid}>
      <Navbar />
      <div className="container-x flex min-h-[60vh] flex-col items-center justify-center pt-24 text-center">
        <Info className="h-12 w-12 text-electric/40" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-2 text-slate-500">{text}</p>
        <Link to={to} className="btn-primary mt-6" data-testid={backTestid}>{backLabel}</Link>
      </div>
      <Footer />
    </div>
  );
}

export function Breadcrumb({ to, section, name }) {
  return (
    <nav className="mb-6 flex items-center gap-1 text-xs text-slate-400" aria-label={t("مسار التنقل")}>
      <Link to="/" className="transition-colors hover:text-aqua">{t("الرئيسية")}</Link>
      <ChevronLeft className="h-3.5 w-3.5" />
      <Link to={to} className="transition-colors hover:text-aqua">{section}</Link>
      <ChevronLeft className="h-3.5 w-3.5" />
      <span className="text-slate-200">{name}</span>
    </nav>
  );
}

export function Paragraphs({ text, testid, title }) {
  const paragraphs = (text || "").split("\n").filter((p) => p.trim());
  if (!paragraphs.length) return null;
  return (
    <div className="space-y-4" data-testid={testid}>
      {title && <h2 className="font-heading text-xl font-bold text-slate-900">{title}</h2>}
      {paragraphs.map((p) => (
        <p key={p.slice(0, 40)} className="leading-relaxed text-slate-600">{p}</p>
      ))}
    </div>
  );
}

export function ContactButtons({ wa, email, prefix, size, emailClass = "btn-outline" }) {
  return (
    <>
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" className={`btn-primary w-full ${size}`} data-testid={`${prefix}-whatsapp`}>
          <MessageCircle className="h-4 w-4" />
          {t("تواصل عبر واتساب")}
        </a>
      )}
      {email && (
        <a href={`mailto:${email}`} className={`${emailClass} w-full ${size}`} data-testid={`${prefix}-email`}>
          <Mail className="h-4 w-4" />
          {t("راسلنا عبر البريد")}
        </a>
      )}
      {!wa && !email && (
        <Link to="/contact" className={`btn-primary w-full ${size}`} data-testid={`${prefix}-contact`}>
          {t("صفحة التواصل")}
          <ArrowLeft className="h-4 w-4" />
        </Link>
      )}
    </>
  );
}
