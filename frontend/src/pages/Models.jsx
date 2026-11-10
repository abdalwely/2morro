import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, CheckCircle2, Route, Info } from "lucide-react";
import api from "@/lib/api";
import { useSEO } from "@/hooks/useSEO";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Reveal from "@/components/site/Reveal";
import {
  PageHeader,
  LoadingBlock,
  EmptyState,
  ApiErrorNotice,
} from "@/components/site/Shared";
import { t, tr, trPage } from "@/lib/i18n";

export default function Models() {
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: () => api.get("/settings").then(r => r.data) });
  const {
    data: models,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["models"],
    queryFn: () => api.get("/delivery-models").then((r) => r.data),
  });
  useSEO({
    title: `${trPage(settings, "models", "title") || t("نماذج التنفيذ")} | 2Morro Technology Solutions`,
    description: trPage(settings, "models", "subtitle") || t("أساليب التعاقد والتوريد والتنفيذ والتشغيل والدعم في 2Morro Technology Solutions."),
    image: settings?.seo?.og_image_url || settings?.logo_url,
  });

  const hasDemo = (models || []).some((m) => m.is_demo);

  return (
    <div className="min-h-screen" data-testid="models-page">
      <Navbar />
      <PageHeader
        page="models"
        badge={t("نماذج التنفيذ")}
        title={t("نماذج مرنة لتقديم وتنفيذ الخدمات") }
        subtitle={t(
          "تعرف على طرق التعاقد والتوريد والتنفيذ والتشغيل والدعم التي يمكن الاتفاق عليها بحسب نطاق كل مشروع.",
        )}
      />

      <section className="py-16 sm:py-20">
        <div className="container-x">
          {isError && <ApiErrorNotice />}
          {hasDemo && (
            <div
              className="mb-10 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
              data-testid="models-demo-notice"
            >
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {t(
                  "النماذج المعروضة أمثلة توضيحية لأسلوب العمل ولم يُعتمد بعضها رسميًا بعد — يمكن للمسؤول تعديلها وإدارتها من لوحة التحكم.",
                )}
              </span>
            </div>
          )}

          {isLoading ? (
            <LoadingBlock />
          ) : isError ? null : (models || []).length === 0 ? (
            <EmptyState
              icon={Route}
              title={t("لا توجد نماذج تنفيذ منشورة حاليًا")}
              desc={t(
                "سيتم عرض نماذج التنفيذ هنا بمجرد نشرها من لوحة التحكم الإدارية.",
              )}
            />
          ) : (
            <div className="relative" data-testid="models-timeline">
              <div
                className="absolute inset-y-0 start-[27px] w-px bg-slate-200 sm:start-[35px]"
                aria-hidden="true"
              />
              <div className="space-y-6">
                {models.map((m, i) => (
                  <Reveal key={m.id} delay={40}>
                    <div
                      className="relative flex gap-5"
                      data-testid={`model-card-${m.id}`}
                    >
                      <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-electric/20 bg-white font-heading text-lg font-black text-electric shadow-md shadow-electric/10 sm:h-[72px] sm:w-[72px] sm:text-xl">
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-electric/30 hover:shadow-lg">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-heading text-lg font-bold text-slate-900 sm:text-xl">
                            {tr(m, "name")}
                          </h2>
                          {m.is_demo && (
                            <span className="chip border-amber-300/60 bg-amber-50 text-amber-700">
                              {t("تجريبي")}
                            </span>
                          )}
                          {tr(m, "duration") && (
                            <span className="chip ms-auto border-slate-200 bg-slate-50 text-slate-500">
                              <Clock className="h-3.5 w-3.5" />
                              {tr(m, "duration")}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                          {tr(m, "short_desc")}
                        </p>
                        {tr(m, "scope") && <p className="mt-3 text-sm leading-7 text-slate-600">{tr(m, "scope")}</p>}

                        {tr(m, "outputs")?.length > 0 && (
                          <div className="mt-4 border-t border-slate-100 pt-4">
                            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-electric">
                              <CheckCircle2 className="h-4 w-4" /> {t("المخرجات أو نطاق الخدمة")}
                            </h3>
                            <ul className="space-y-2">
                              {tr(m, "outputs").map((o, idx) => (
                                <li key={`${o}-${idx}`} className="flex items-start gap-2 text-sm text-slate-600">
                                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-electric" /> {o}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
