import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Info } from "lucide-react";
import api from "@/lib/api";
import { useSEO } from "@/hooks/useSEO";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Reveal from "@/components/site/Reveal";
import { ProjectCard } from "@/components/site/Cards";
import {
  PageHeader,
  LoadingBlock,
  EmptyState,
  ApiErrorNotice,
} from "@/components/site/Shared";
import { t, tr, trPage } from "@/lib/i18n";

export default function Projects() {
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: () => api.get("/settings").then(r => r.data) });
  const [category, setCategory] = useState(t("الكل"));
  const {
    data: projects,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.get("/projects").then((r) => r.data),
  });
  useSEO({
    title: `${trPage(settings, "projects", "title") || t("مشاريعنا")} | 2Morro Technology Solutions`,
    description: trPage(settings, "projects", "subtitle") || t("استعرض معرض أعمال 2Morro Technology Solutions: مشاريع وأنظمة وحلول رقمية نماذج منها تعكس منهجيتنا في التنفيذ."),
    image: settings?.seo?.og_image_url || settings?.logo_url,
  });

  const categories = useMemo(() => {
    const set = new Set(
      (projects || []).map((p) => tr(p.relations?.category_id?.[0], "name") || tr(p, "category")).filter(Boolean),
    );
    return [t("الكل"), ...Array.from(set)];
  }, [projects]);

  const filtered =
    category === t("الكل")
      ? projects || []
      : (projects || []).filter((p) => (tr(p.relations?.category_id?.[0], "name") || tr(p, "category")) === category);
  const hasDemo = (projects || []).some((p) => p.is_demo);

  return (
    <div className="min-h-screen" data-testid="projects-page">
      <Navbar />
      <PageHeader
        page="projects"
        badge={t("مشاريعنا")}
        title={t("مجالات المشاريع ونماذج العرض")}
        subtitle={t(
          "تصنيفات مجالات المشاريع الواردة في الملف التعريفي، مع نماذج عرض تجريبية توضح شكل المحتوى قبل إضافة دراسات حالة موثقة.",
        )}
      />

      <section className="py-16 sm:py-20">
        <div className="container-x">
          {isError && <ApiErrorNotice />}
          {hasDemo && (
            <div
              className="mb-8 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
              data-testid="projects-demo-notice"
            >
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {t(
                  "المشاريع المعروضة حاليًا بيانات تجريبية معلَّمة بوضوح لأغراض العرض، ولم تُعتمد بعد كأعمال منفذة رسميًا. يمكن للمسؤول استبدالها من لوحة التحكم.",
                )}
              </span>
            </div>
          )}

          {categories.length > 1 && (
            <div
              className="mb-10 flex flex-wrap gap-2"
              data-testid="projects-category-filter"
            >
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  data-testid={`projects-filter-${c}`}
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
              icon={Briefcase}
              title={t("لا توجد مشاريع منشورة حاليًا")}
              desc={t(
                "سيتم عرض المشاريع هنا بمجرد نشرها من لوحة التحكم الإدارية.",
              )}
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p, i) => (
                <Reveal key={p.id} delay={(i % 3) * 60}>
                  <ProjectCard project={p} />
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
