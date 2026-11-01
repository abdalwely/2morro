import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import api, { waLink } from "@/lib/api";
import { useSEO } from "@/hooks/useSEO";
import { getIcon } from "@/lib/icons";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Reveal from "@/components/site/Reveal";
import { ProjectCard } from "@/components/site/Cards";
import { SafeImage, DemoBadge } from "@/components/site/Shared";
import { DetailLoading, DetailNotFound, Breadcrumb, Paragraphs, ContactButtons } from "@/components/site/DetailParts";
import { t, tr } from "@/lib/i18n";

const fetcher = (url) => () => api.get(url).then((r) => r.data);

function ServiceHeader({ service }) {
  const Icon = getIcon(service.icon);
  return (
    <header className="relative overflow-hidden bg-navy-900 pb-20 pt-32 sm:pt-40">
      <div className="grid-pattern absolute inset-0" aria-hidden="true" />
      <div className="absolute -top-24 start-1/3 h-72 w-72 rounded-full bg-electric/25 blur-[110px]" aria-hidden="true" />
      <div className="container-x relative">
        <Breadcrumb to="/services" section={t("خدماتنا")} name={tr(service, "name")} />
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-electric text-white shadow-lg shadow-electric/40">
            <Icon className="h-8 w-8" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white sm:text-3xl lg:text-4xl" data-testid="service-detail-title">{tr(service, "name")}</h1>
              {service.is_demo && <DemoBadge />}
            </div>
            <p className="mt-2 max-w-2xl text-slate-300">{tr(service, "short_desc")}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

function ServiceFeatures({ features }) {
  if (!features?.length) return null;
  return (
    <div className="mt-10">
      <h2 className="font-heading text-xl font-bold text-slate-900">{t("مزايا الخدمة والمخرجات")}</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {features.map((f, i) => (
          <div key={f} className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-4" data-testid={`service-feature-${i}`}>
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-electric" />
            <span className="text-sm font-medium leading-relaxed text-slate-700">{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RelatedProjects({ projects }) {
  if (!projects.length) return null;
  return (
    <section className="bg-slate-50 py-14" data-testid="service-related-projects">
      <div className="container-x">
        <h2 className="font-heading text-xl font-bold text-slate-900">{t("مشاريع مرتبطة بهذه الخدمة")}</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <Reveal key={p.id} delay={i * 60}>
              <ProjectCard project={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ServiceDetail() {
  const { slug } = useParams();
  const { data: service, isLoading, isError } = useQuery({
    queryKey: ["service", slug],
    queryFn: fetcher(`/services/${encodeURIComponent(slug)}`),
    retry: false,
  });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: fetcher("/settings") });
  const { data: projects } = useQuery({ queryKey: ["projects"], queryFn: fetcher("/projects") });

  useSEO({
    title: service ? `${service.seo_title || tr(service, "name")} | 2Morro Technically Solutions` : t("الخدمة | 2Morro Technically Solutions"),
    description: service?.seo_description || tr(service, "short_desc"),
  });

  if (isLoading) return <DetailLoading />;
  if (isError || !service) {
    return (
      <DetailNotFound testid="service-not-found" title={t("الخدمة غير موجودة")} text={t("ربما تم حذف هذه الخدمة أو إخفاؤها من النشر.")}
        to="/services" backLabel={t("العودة إلى الخدمات")} backTestid="service-notfound-back" />
    );
  }

  const relatedProjects = (projects || []).filter((p) => p.service_id === service.id).slice(0, 3);
  const wa = settings?.whatsapp_number ? waLink(settings.whatsapp_number, t("مرحبًا، أود الاستفسار عن خدمة: {name}", { name: tr(service, "name") })) : "";
  const hasText = Boolean((tr(service, "detailed_desc") || "").trim());

  return (
    <div className="min-h-screen bg-white" data-testid="service-detail-page">
      <Navbar />
      <ServiceHeader service={service} />
      <section className="py-14 sm:py-16">
        <div className="container-x grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {hasText ? (
              <Paragraphs text={tr(service, "detailed_desc")} testid="service-detail-description" />
            ) : (
              <p className="leading-relaxed text-slate-500">{t("لم تُضف التفاصيل الكاملة لهذه الخدمة بعد.")}</p>
            )}
            {service.image_url && (
              <Reveal className="mt-8">
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <SafeImage src={service.image_url} alt={tr(service, "name")} className="aspect-video w-full object-cover" />
                </div>
              </Reveal>
            )}
            <ServiceFeatures features={tr(service, "features")} />
          </div>
          <aside>
            <div className="sticky top-24 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="font-heading text-lg font-bold text-slate-900">{t("مهتم بهذه الخدمة؟")}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{t("تواصل معنا مباشرة لمناقشة متطلباتك وسنكون سعداء بالإجابة على استفساراتك.")}</p>
              <div className="mt-5 flex flex-col gap-3">
                <ContactButtons wa={wa} email={settings?.email} prefix="service-detail" size="!text-xs sm:!text-sm" />
              </div>
            </div>
          </aside>
        </div>
      </section>
      <RelatedProjects projects={relatedProjects} />
      <Footer />
    </div>
  );
}
