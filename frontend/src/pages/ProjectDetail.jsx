import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Target, ListChecks, Cpu } from "lucide-react";
import api, { imgSrc, waLink } from "@/lib/api";
import { useSEO } from "@/hooks/useSEO";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { DemoBadge } from "@/components/site/Shared";
import { DetailLoading, DetailNotFound, Breadcrumb, Paragraphs, ContactButtons } from "@/components/site/DetailParts";
import { ProjectGallery, InfoCard, RelatedService } from "@/components/site/ProjectParts";
import { t, tr } from "@/lib/i18n";

const fetcher = (url) => () => api.get(url).then((r) => r.data);

function ProjectHeader({ project }) {
  return (
    <header className="relative overflow-hidden bg-navy-900 pb-16 pt-32 sm:pt-40">
      <div className="grid-pattern absolute inset-0" aria-hidden="true" />
      <div className="container-x relative">
        <Breadcrumb to="/projects" section={t("مشاريعنا")} name={tr(project, "name")} />
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl lg:text-4xl" data-testid="project-detail-title">{tr(project, "name")}</h1>
          {project.is_demo && <DemoBadge />}
          {(tr(project, "category") || tr(project.relations?.category_id?.[0], "name")) && <span className="chip border-aqua/30 bg-aqua/10 text-aqua">{tr(project, "category") || tr(project.relations?.category_id?.[0], "name")}</span>}
        </div>
        <p className="mt-3 max-w-2xl text-slate-300">{tr(project, "short_desc")}</p>
      </div>
    </header>
  );
}

function ProjectSidebar({ project, relatedService, wa, email }) {
  return (
    <aside className="space-y-6">
      {(project.technologies?.length > 0 || project.relations?.technology_ids?.length > 0) && (
        <InfoCard icon={Cpu} title={t("التقنيات المستخدمة")}>
          <div className="mt-3 flex flex-wrap gap-2">
            {[...(project.technologies || []), ...(project.relations?.technology_ids || []).map(x => tr(x, "name"))].map((t, i) => (
              <span key={t} className="chip border-electric/20 bg-white text-electric" data-testid={`project-tech-${i}`}>{t}</span>
            ))}
          </div>
        </InfoCard>
      )}
      {tr(project, "goals") && (
        <InfoCard icon={Target} title={t("أهداف المشروع")}>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{tr(project, "goals")}</p>
        </InfoCard>
      )}
      {tr(project, "outputs") && (
        <InfoCard icon={ListChecks} title={t("مخرجات المشروع")}>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{tr(project, "outputs")}</p>
        </InfoCard>
      )}
      {(project.relations?.service_ids?.length > 1) && <InfoCard icon={Cpu} title={t("الخدمات المرتبطة")}><div className="mt-3 flex flex-wrap gap-2">{project.relations.service_ids.map(s => <span key={s.id} className="chip border-electric/20 bg-white text-electric">{tr(s, "name")}</span>)}</div></InfoCard>}
      {(project.relations?.solution_ids?.length > 0) && <InfoCard icon={Cpu} title={t("الحلول المرتبطة")}><div className="mt-3 flex flex-wrap gap-2">{project.relations.solution_ids.map(s => <span key={s.id} className="chip border-electric/20 bg-white text-electric">{tr(s, "name")}</span>)}</div></InfoCard>}
      {(project.relations?.sector_ids?.length > 0) && <InfoCard icon={Cpu} title={t("القطاعات") }><div className="mt-3 flex flex-wrap gap-2">{project.relations.sector_ids.map(s => <span key={s.id} className="chip border-electric/20 bg-white text-electric">{tr(s, "name")}</span>)}</div></InfoCard>}
      {relatedService && (!project.relations?.service_ids?.length || project.relations.service_ids.length === 1) && <RelatedService service={relatedService} />}
      {project.external_url && (
        <a href={project.external_url} target="_blank" rel="noopener noreferrer" className="btn-outline w-full" data-testid="project-external-link">
          <ExternalLink className="h-4 w-4" />
          {t("زيارة الرابط الخارجي")}
        </a>
      )}
      <div className="rounded-2xl border border-slate-200 bg-navy-800 p-6 text-white">
        <h3 className="font-heading text-base font-bold">{t("هل أعجبك هذا المشروع؟")}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">{t("تواصل معنا لمناقشة مشروعك القادم.")}</p>
        <div className="mt-4 flex flex-col gap-2.5">
          <ContactButtons wa={wa} email={email} prefix="project-cta" size="!py-2.5 !text-xs" emailClass="btn-ghost-light" />
        </div>
      </div>
    </aside>
  );
}

export default function ProjectDetail() {
  const { slug } = useParams();
  const { data: project, isLoading, isError } = useQuery({
    queryKey: ["project", slug],
    queryFn: fetcher(`/projects/${encodeURIComponent(slug)}`),
    retry: false,
  });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: fetcher("/settings") });
  const { data: services } = useQuery({ queryKey: ["services"], queryFn: fetcher("/services") });

  useSEO({
    title: project ? (tr(project, "seo_title") || t("{name} | مشاريع 2Morro Technology Solutions", { name: tr(project, "name") })) : t("المشروع | 2Morro Technology Solutions"),
    description: tr(project, "seo_description") || tr(project, "short_desc"),
    image: project?.main_image_url,
    schema: project ? { "@context": "https://schema.org", "@type": "CreativeWork", name: tr(project, "name"), description: tr(project, "short_desc"), image: project.main_image_url || undefined, creator: { "@type": "Organization", name: "2Morro Technology Solutions" } } : undefined,
  });

  if (isLoading) return <DetailLoading />;
  if (isError || !project) {
    return (
      <DetailNotFound testid="project-not-found" title={t("المشروع غير موجود")} text={t("ربما تم حذف هذا المشروع أو إخفاؤه من النشر.")}
        to="/projects" backLabel={t("العودة إلى المشاريع")} backTestid="project-notfound-back" />
    );
  }

  const relatedService = (project.relations?.service_ids || []).find(s => s.id) || (services || []).find((s) => s.id === project.service_id);
  const wa = settings?.whatsapp_number
    ? waLink(settings.whatsapp_number, t("مرحبًا، شاهدت مشروع «{name}» وأود الاستفسار عن خدمات مشابهة", { name: tr(project, "name") }))
    : "";

  return (
    <div className="min-h-screen bg-white" data-testid="project-detail-page">
      <Navbar />
      <ProjectHeader project={project} />
      <section className="py-12 sm:py-16">
        <div className="container-x grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {project.main_image_url && (
              <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 shadow-xl shadow-navy-900/5">
                <img src={imgSrc(project.main_image_url)} alt={tr(project, "name")} className="aspect-video w-full object-cover" data-testid="project-main-image" />
              </div>
            )}
            <Paragraphs text={tr(project, "detailed_desc")} testid="project-detail-description" title={t("عن المشروع")} />
            <ProjectGallery urls={project.gallery_urls || []} name={tr(project, "name")} />
          </div>
          <ProjectSidebar project={project} relatedService={relatedService} wa={wa} email={settings?.email} />
        </div>
      </section>
      <Footer />
    </div>
  );
}
