import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Clock, CheckCircle2, Route, Info } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { t, tr } from "@/lib/i18n";

export default function Models() {
  const {
    data: models,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["models"],
    queryFn: () => api.get("/delivery-models").then((r) => r.data),
  });
  useSEO({
    title: t("نماذج التنفيذ | 2Morro Technically Solutions"),
    description: t(
      "نماذج تنفيذ الأعمال في 2Morro Technically Solutions: مراحل تنفيذ المشاريع والمخرجات المتوقعة ومدد التنفيذ التقريبية.",
    ),
  });

  const hasDemo = (models || []).some((m) => m.is_demo);

  return (
    <div className="min-h-screen" data-testid="models-page">
      <Navbar />
      <PageHeader
        page="models"
        badge={t("نماذج التنفيذ")}
        title={t("منهجية عمل مرحلية… من التحليل إلى الدعم")}
        subtitle={t(
          "نماذج توضح أسلوبنا في تنفيذ المشاريع وإدارة مراحل العمل والمخرجات المتوقعة من كل مرحلة.",
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

                        {(tr(m, "phases")?.length > 0 ||
                          tr(m, "outputs")?.length > 0) && (
                          <Accordion type="single" collapsible className="mt-4">
                            <AccordionItem
                              value={`phases-${m.id}`}
                              className="border-slate-200"
                            >
                              <AccordionTrigger
                                className="py-3 text-sm font-bold text-electric hover:no-underline"
                                data-testid={`model-phases-toggle-${m.id}`}
                              >
                                <span className="flex items-center gap-2">
                                  <Route className="h-4 w-4" />
                                  {t("مراحل التنفيذ")} (
                                  {tr(m, "phases")?.length || 0})
                                </span>
                              </AccordionTrigger>
                              <AccordionContent className="pb-2">
                                <ol className="relative space-y-4 border-s-2 border-dashed border-electric/20 ps-5">
                                  {(tr(m, "phases") || []).map((ph, idx) => (
                                    <li
                                      key={`${ph.title}-${idx}`}
                                      className="relative"
                                      data-testid={`model-phase-${m.id}-${idx}`}
                                    >
                                      <span
                                        className="absolute -start-[27px] top-1 h-3.5 w-3.5 rounded-full border-2 border-electric bg-white"
                                        aria-hidden="true"
                                      />
                                      <h3 className="text-sm font-bold text-slate-800">
                                        {ph.title}
                                      </h3>
                                      {ph.desc && (
                                        <p className="mt-1 text-xs leading-relaxed text-slate-500">
                                          {ph.desc}
                                        </p>
                                      )}
                                    </li>
                                  ))}
                                </ol>
                              </AccordionContent>
                            </AccordionItem>
                            {tr(m, "outputs")?.length > 0 && (
                              <AccordionItem
                                value={`outputs-${m.id}`}
                                className="border-b-0"
                              >
                                <AccordionTrigger
                                  className="py-3 text-sm font-bold text-electric hover:no-underline"
                                  data-testid={`model-outputs-toggle-${m.id}`}
                                >
                                  <span className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    {t("المخرجات المتوقعة")} (
                                    {tr(m, "outputs").length})
                                  </span>
                                </AccordionTrigger>
                                <AccordionContent className="pb-2">
                                  <ul className="space-y-2">
                                    {tr(m, "outputs").map((o, idx) => (
                                      <li
                                        key={o}
                                        className="flex items-start gap-2 text-sm text-slate-600"
                                        data-testid={`model-output-${m.id}-${idx}`}
                                      >
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-electric" />
                                        {o}
                                      </li>
                                    ))}
                                  </ul>
                                </AccordionContent>
                              </AccordionItem>
                            )}
                          </Accordion>
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
