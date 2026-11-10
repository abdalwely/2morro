import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layers, Info } from "lucide-react";
import api from "@/lib/api";
import { useSEO } from "@/hooks/useSEO";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Reveal from "@/components/site/Reveal";
import { ServiceCard } from "@/components/site/Cards";
import {
  PageHeader,
  LoadingBlock,
  EmptyState,
  ApiErrorNotice,
} from "@/components/site/Shared";
import { t, tr, trPage } from "@/lib/i18n";

export default function Services() {
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: () => api.get("/settings").then(r => r.data) });
  const [category, setCategory] = useState(t("الكل"));
  const {
    data: services,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["services"],
    queryFn: () => api.get("/services").then((r) => r.data),
  });
  useSEO({
    title: `${trPage(settings, "services", "title") || t("خدماتنا")} | 2Morro Technology Solutions`,
    description: trPage(settings, "services", "subtitle") || t("استعرض قائمة الخدمات التقنية التي تقدمها شركة 2Morro Technology Solutions: التطوير، الحلول السحابية، الأمن السيبراني، تحليل البيانات والمزيد."),
    image: settings?.seo?.og_image_url || settings?.logo_url,
  });

  const categories = useMemo(() => {
    const set = new Set(
      (services || []).map((s) => tr(s.relations?.domain_id?.[0], "name") || tr(s, "category")).filter(Boolean),
    );
    return [t("الكل"), ...Array.from(set)];
  }, [services]);

  const filtered =
    category === t("الكل")
      ? services || []
      : (services || []).filter((s) => (tr(s.relations?.domain_id?.[0], "name") || tr(s, "category")) === category);
  const hasDemo = (services || []).some((s) => s.is_demo);

  return (
    <div className="min-h-screen" data-testid="services-page">
      <Navbar />
      <PageHeader
        page="services"
        badge={t("خدماتنا")}
        title={t("حلول تقنية متخصصة لكل احتياج")}
        subtitle={t(
          "مجموعة متكاملة من الخدمات التقنية الاحترافية التي نصممها ونطورها ونشغّلها لأجل أعمال عملائنا.",
        )}
      />

      <section className="py-16 sm:py-20">
        <div className="container-x">
          {isError && <ApiErrorNotice />}
          {hasDemo && (
            <div
              className="mb-8 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
              data-testid="services-demo-notice"
            >
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {t(
                  "الخدمات المعروضة حاليًا بيانات تجريبية معلَّمة بوضوح، ويمكن للمسؤول تعديلها أو استبدالها بالكامل من لوحة التحكم.",
                )}
              </span>
            </div>
          )}

          {categories.length > 1 && (
            <div
              className="mb-10 flex flex-wrap gap-2"
              data-testid="services-category-filter"
            >
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  data-testid={`services-filter-${c}`}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition-all duration-200 ${
                    category === c
                      ? "bg-electric text-white shadow-md shadow-electric/30"
                      : "border border-slate-300 bg-white text-slate-600 hover:border-electric hover:text-electric"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {isLoading ? (
            <LoadingBlock />
          ) : isError ? null : filtered.length === 0 ? (
            <EmptyState
              icon={Layers}
              title={t("لا توجد خدمات منشورة حاليًا")}
              desc={t(
                "سيتم عرض الخدمات هنا بمجرد نشرها من لوحة التحكم الإدارية.",
              )}
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((s, i) => (
                <Reveal key={s.id} delay={(i % 3) * 60}>
                  <ServiceCard service={s} index={i} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
