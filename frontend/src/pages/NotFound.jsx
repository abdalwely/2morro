import { Link } from "react-router-dom";
import { ArrowLeft, Compass } from "lucide-react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { useSEO } from "@/hooks/useSEO";
import { t } from "@/lib/i18n";

export default function NotFound() {
  useSEO({ title: t("الصفحة غير موجودة | 2Morro Technology Solutions"), description: t("الصفحة المطلوبة غير موجودة."), robots: "noindex,follow" });
  return (
    <div className="flex min-h-screen flex-col bg-navy-900" data-testid="not-found-page">
      <Navbar />
      <main className="relative flex flex-1 items-center justify-center overflow-hidden py-32">
        <div className="grid-pattern absolute inset-0" aria-hidden="true" />
        <div className="absolute top-1/3 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-electric/20 blur-[120px]" aria-hidden="true" />
        <div className="container-x relative text-center">
          <span className="font-heading text-7xl font-black text-electric sm:text-8xl" data-testid="not-found-code">404</span>
          <h1 className="mt-4 text-2xl font-bold text-white sm:text-3xl">{t("عذرًا… الصفحة التي تبحث عنها غير موجودة")}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-400">
            {t("ربما تم نقل الصفحة أو حذفها، أو أن الرابط المدخل غير صحيح. يمكنك العودة إلى الصفحة الرئيسية واستكشاف بقية الأقسام.")}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/" className="btn-primary" data-testid="not-found-home-button">
              <Compass className="h-4 w-4" />
              {t("العودة إلى الرئيسية")}
            </Link>
            <Link to="/services" className="btn-ghost-light" data-testid="not-found-services-button">
              {t("استكشاف الخدمات")}
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
