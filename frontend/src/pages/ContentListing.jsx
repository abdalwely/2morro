import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Reveal from "@/components/site/Reveal";
import { PageHeader, LoadingBlock, EmptyState, ApiErrorNotice, SafeImage, DemoBadge } from "@/components/site/Shared";
import { t, tr, trPage } from "@/lib/i18n";
import { useSEO } from "@/hooks/useSEO";

const DATA = {
 domains: { endpoint: "/domains", title: "المجالات التقنية", subtitle: "المجالات الرئيسية التي تغطي خبرات وخدمات الشركة." },
 solutions: { endpoint: "/solutions", title: "الحلول المتكاملة", subtitle: "حلول تجمع الخدمات والتقنيات لتلبية احتياجات الأعمال." },
 sectors: { endpoint: "/sectors", title: "القطاعات", subtitle: "القطاعات التي يمكن أن تستفيد من خدمات وحلول الشركة." },
 technology: { endpoint: "/technologies", title: "المنظومة التقنية", subtitle: "التقنيات والمنصات التي تدخل ضمن نطاق خبراتنا وحلولنا." },
 methodology: { endpoint: "/methodology", title: "منهجية العمل", subtitle: "مراحل واضحة لفهم المتطلبات والتصميم والتنفيذ والفحص والتشغيل والدعم." },
 knowledge: { endpoint: "/articles", title: "مركز المعرفة", subtitle: "مقالات وأدلة وموارد تقنية تنشرها الشركة." },
};
export default function ContentListing({ type }) {
 const cfg = DATA[type];
 const { data = [], isLoading, isError } = useQuery({ queryKey: ["content-list", type], queryFn: () => api.get(cfg.endpoint).then(r => r.data) });
 const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: () => api.get("/settings").then(r => r.data) });
 useSEO({ title: `${trPage(settings, type, "title") || t(cfg.title)} | 2Morro Technology Solutions`, description: trPage(settings, type, "subtitle") || t(cfg.subtitle), type: "website", image: settings?.seo?.og_image_url || settings?.logo_url, schema: { "@context": "https://schema.org", "@type": "CollectionPage", name: trPage(settings, type, "title") || t(cfg.title), description: trPage(settings, type, "subtitle") || t(cfg.subtitle) } });
 return <div className="min-h-screen"><Navbar /><PageHeader page={type} badge={t(cfg.title)} title={t(cfg.title)} subtitle={t(cfg.subtitle)} /><section className="py-16"><div className="container-x">{isError && <ApiErrorNotice />}{type === "technology" && <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600">{t("الأسماء والمنظومات التقنية المعروضة أمثلة على تقنيات يمكن العمل معها حسب نطاق المشروع، ولا تعني وجود شراكة أو اعتماد رسمي.")}</div>}{isLoading ? <LoadingBlock /> : data.length === 0 ? <EmptyState title={t("لا يوجد محتوى منشور حاليًا")} desc={t("سيظهر المحتوى هنا بعد إضافته واعتماده من لوحة الإدارة.")} /> : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{data.map((item, i) => <Reveal key={item.id} delay={(i % 3) * 50}><article className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="aspect-[16/9] bg-slate-100">{(item.image_url || item.logo_url || item.cover_image_url) && <SafeImage src={item.image_url || item.logo_url || item.cover_image_url} alt={tr(item, "name") || tr(item, "title") || item.title} className="h-full w-full object-cover" />}</div><div className="p-5"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-extrabold text-slate-900">{tr(item, "name") || tr(item, "title") || item.title}</h2>{item.is_demo && <DemoBadge />}{item.is_proposed && <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{t("تصور مقترح")}</span>}</div>{type === "technology" && <span className="mt-2 inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{t(({ technology: "تقنية", platform: "منصة", certification: "شهادة", accreditation: "اعتماد", official_partner: "شريك رسمي" })[item.relationship_type] || tr(item, "category") || "تقنية")}</span>}<p className="mt-2 line-clamp-4 text-sm leading-7 text-slate-600">{tr(item, "short_desc") || tr(item, "short_description") || tr(item, "summary") || tr(item, "description") || tr(item, "detailed_desc")}</p>{(item.website_url || item.verification_url) && <a href={item.website_url || item.verification_url} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-bold text-electric">{t("الموقع الرسمي للتقنية")}</a>}{(type === "solutions" || type === "domains" || type === "sectors" || type === "knowledge") && item.slug && <Link to={`/${type}/${item.slug}`} className="mt-4 block text-sm font-bold text-electric">{t("عرض التفاصيل")}</Link>}</div></article></Reveal>)}</div>}</div></section><Footer /></div>;
}
