import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Download } from "lucide-react";
import api from "@/lib/api";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { PageHeader, LoadingBlock, ApiErrorNotice, SafeImage, DemoBadge } from "@/components/site/Shared";
import { useSEO } from "@/hooks/useSEO";
import { tr, t } from "@/lib/i18n";
const CONFIG = {
 domains: { endpoint: "/domains", title: "المجال التقني" },
 solutions: { endpoint: "/solutions", title: "الحل المتكامل" },
 sectors: { endpoint: "/sectors", title: "القطاع" },
 knowledge: { endpoint: "/articles", title: "مركز المعرفة" },
};
export default function ContentDetail({ type }) {
 const { slug } = useParams(); const cfg = CONFIG[type];
 const { data, isLoading, isError } = useQuery({ queryKey: ["content-detail", type, slug], queryFn: () => api.get(`${cfg.endpoint}/${slug}`).then(r => r.data), enabled: Boolean(slug) });
 const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: () => api.get("/settings").then(r => r.data) });
 useSEO({
  title: tr(data, "seo_title") || (data ? `${tr(data, "name") || tr(data, "title") || data.title} | 2Morro Technology Solutions` : cfg.title),
  description: tr(data, "seo_description") || tr(data, "short_desc") || tr(data, "summary") || tr(data, "description") || cfg.title,
  image: data?.cover_image_url || data?.image_url || settings?.seo?.og_image_url || settings?.logo_url,
  type: type === "knowledge" ? "article" : "website",
  schema: data && type === "knowledge" ? { "@context": "https://schema.org", "@type": "Article", headline: tr(data, "title"), description: tr(data, "summary"), image: data.cover_image_url || undefined, datePublished: data.published_at || undefined, author: data.author ? { "@type": "Person", name: data.author } : undefined } : undefined,
 });
 return <div className="min-h-screen"><Navbar />{isLoading ? <main className="container-x py-40"><LoadingBlock /></main> : isError || !data ? <main className="container-x py-40"><ApiErrorNotice /></main> : <><PageHeader badge={t(cfg.title)} title={tr(data, "name") || tr(data, "title") || data.title} subtitle={tr(data, "short_desc") || tr(data, "summary") || ""} />{(data.is_demo || data.is_proposed) && <div className="container-x pt-6">{data.is_demo ? <DemoBadge /> : <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">{t("تصور مقترح")}</span>}</div>}<main className="container-x max-w-5xl py-12">{(data.image_url || data.cover_image_url) && <SafeImage src={data.image_url || data.cover_image_url} alt={tr(data, "name") || tr(data, "title")} className="mb-8 max-h-[460px] w-full rounded-2xl object-cover" />}{tr(data, "content") && <article className="whitespace-pre-line text-base leading-9 text-slate-700">{tr(data, "content")}</article>}{data.attachment_url && <a href={data.attachment_url} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-electric px-5 py-3 text-sm font-bold text-white"><Download className="h-4 w-4" />{t("تحميل المورد")}</a>}{tr(data, "detailed_desc") && <article className="whitespace-pre-line text-base leading-9 text-slate-700">{tr(data, "detailed_desc")}</article>}{Object.entries(data.relations || {}).filter(([, values]) => Array.isArray(values) && values.length).map(([field, values]) => <section key={field} className="mt-10"><h2 className="mb-4 text-xl font-extrabold">{t(({ service_ids: "الخدمات المرتبطة", services: "الخدمات المرتبطة", solution_ids: "الحلول المرتبطة", solutions: "الحلول المرتبطة", project_ids: "المشاريع المرتبطة", projects: "المشاريع المرتبطة", sector_ids: "القطاعات المرتبطة", technology_ids: "التقنيات المرتبطة" })[field] || "المحتوى المرتبط")}</h2><div className="flex flex-wrap gap-2">{values.map(x => <span key={x.id} className="rounded-full bg-slate-100 px-4 py-2 text-sm">{tr(x, "name") || tr(x, "title")}</span>)}</div></section>)}</main></>}<Footer /></div>;
}
