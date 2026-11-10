import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { PageHeader, LoadingBlock } from "@/components/site/Shared";
import { useLang, t } from "@/lib/i18n";
import { useSEO } from "@/hooks/useSEO";
export default function LegalPage({ type }) {
 const { lang } = useLang();
 const { data, isLoading } = useQuery({ queryKey: ["settings"], queryFn: () => api.get("/settings").then(r => r.data) });
 const title = type === "privacy" ? "سياسة الخصوصية" : "الشروط والأحكام";
 const content = data?.[type === "privacy" ? "privacy_policy" : "terms"]?.[lang] || data?.[type === "privacy" ? "privacy_policy" : "terms"]?.ar || "";
 useSEO({ title: `${title} | ${data?.company_name || "2Morro Technology Solutions"}`, description: title, image: data?.seo?.og_image_url || data?.logo_url });
 return <div className="min-h-screen"><Navbar /><PageHeader page={type} badge={t(title)} title={t(title)} subtitle="" /><main className="container-x min-h-[40vh] py-12">{isLoading ? <LoadingBlock /> : content ? <article className="prose prose-slate max-w-none whitespace-pre-line leading-8">{content}</article> : <p className="text-sm text-slate-500">{t("لم يتم نشر هذا المحتوى بعد.")}</p>}</main><Footer /></div>;
}
