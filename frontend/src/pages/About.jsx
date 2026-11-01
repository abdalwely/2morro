import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Target, Compass, ArrowLeft, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useSEO } from "@/hooks/useSEO";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Reveal from "@/components/site/Reveal";
import { PageHeader, SafeImage } from "@/components/site/Shared";
import { t, tr } from "@/lib/i18n";

const IMG_ABOUT = "https://images.unsplash.com/photo-1629904853893-c2c8981a1dc5?auto=format&fit=crop&w=1200&q=80";

export default function About() {
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: () => api.get("/settings").then((r) => r.data) });
  useSEO({
    title: t("من نحن | {name}", { name: settings?.company_name || "2Morro Technically Solutions" }),
    description: tr(settings, "about_short"),
  });

  const paragraphs = (tr(settings, "about_content") || "").split("\n").filter((p) => p.trim());
  const values = tr(settings, "values") || [];

  return (
    <div className="min-h-screen" data-testid="about-page">
      <Navbar />
      <PageHeader
        page="about"
        badge={t("من نحن")}
        title={t("فريق تقني يعمل بمنهجية واضحة وشغف حقيقي بالجودة")}
        subtitle={tr(settings, "about_short")}
      />

      <section className="py-16 sm:py-20">
        <div className="container-x grid items-start gap-12 lg:grid-cols-2">
          <Reveal>
            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-xl shadow-navy-900/5">
              <SafeImage src={IMG_ABOUT} alt={t("فريق 2Morro Technically Solutions")} className="aspect-[4/3] w-full object-cover" />
            </div>
          </Reveal>
          <div>
            <Reveal>
              <span className="chip border-electric/20 bg-electric-50 text-electric">{t("نبذة عن الشركة")}</span>
              <h2 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">{t("من نحن؟")}</h2>
              <div className="mt-4 space-y-4">
                {paragraphs.map((p, i) => (
                  <p key={p.slice(0, 40)} className="leading-relaxed text-slate-600">{p}</p>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20" data-testid="about-vision-mission">
        <div className="container-x grid gap-6 md:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-2xl border border-slate-200 bg-navy-800 p-8 text-white transition-shadow duration-300 hover:shadow-xl">
              <Compass className="h-9 w-9 text-aqua" />
              <h3 className="mt-4 font-heading text-xl font-bold">{t("رؤيتنا")}</h3>
              <p className="mt-3 leading-relaxed text-slate-300">{tr(settings, "vision") || t("لم تُعتمد الرؤية بعد — يمكن للمسؤول إضافتها من لوحة التحكم.")}</p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="h-full rounded-2xl border border-slate-200 bg-electric p-8 text-white transition-shadow duration-300 hover:shadow-xl">
              <Target className="h-9 w-9 text-white" />
              <h3 className="mt-4 font-heading text-xl font-bold">{t("رسالتنا")}</h3>
              <p className="mt-3 leading-relaxed text-white/90">{tr(settings, "mission") || t("لم تُعتمد الرسالة بعد — يمكن للمسؤول إضافتها من لوحة التحكم.")}</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-16 sm:py-20" data-testid="about-values">
        <div className="container-x">
          <Reveal>
            <div className="max-w-2xl">
              <span className="chip border-electric/20 bg-electric-50 text-electric">{t("قيمنا المهنية")}</span>
              <h2 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">{t("مبادئ تحكم كل مشروع ننفذه")}</h2>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((v, i) => (
              <Reveal key={v} delay={i * 60}>
                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-electric/30 hover:shadow-lg" data-testid={`about-value-${i}`}>
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-electric" />
                  <span className="text-sm font-medium leading-relaxed text-slate-700">{v}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-navy-900 py-16" data-testid="about-cta">
        <div className="grid-pattern absolute inset-0" aria-hidden="true" />
        <div className="container-x relative flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-start">
          <div>
            <h2 className="text-xl font-bold text-white sm:text-2xl">{t("هل تريد التعرف على طريقة عملنا؟")}</h2>
            <p className="mt-2 text-sm text-slate-300">{t("استعرض نماذج التنفيذ التي توضح منهجيتنا في إدارة المشاريع.")}</p>
          </div>
          <div className="flex gap-3">
            <Link to="/models" className="btn-primary" data-testid="about-cta-models-button">
              {t("نماذج التنفيذ")}
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Link to="/contact" className="btn-ghost-light" data-testid="about-cta-contact-button">
              {t("تواصل معنا")}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
