import { useQuery } from "@tanstack/react-query";
import api, { waLink } from "@/lib/api";
import { useSEO } from "@/hooks/useSEO";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import {
  HomeHero,
  HomeServices,
  HomeDomains,
  HomeSolutions,
  HomeAbout,
  HomeSectors,
  HomeTechnology,
  HomeKnowledge,
  HomeWhy,
  HomeProjects,
  HomeMethodology,
  HomeQuality,
  HomeCta,
} from "@/components/site/HomeSections";
import { t, tr } from "@/lib/i18n";
import { ApiErrorNotice } from "@/components/site/Shared";

const fetcher = (url) => () => api.get(url).then((r) => r.data);

export default function Home() {
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: fetcher("/settings"),
  });
  const {
    data: services,
    isLoading: loadingServices,
    isError: servicesError,
  } = useQuery({ queryKey: ["services"], queryFn: fetcher("/services") });
  const {
    data: projects,
    isLoading: loadingProjects,
    isError: projectsError,
  } = useQuery({ queryKey: ["projects"], queryFn: fetcher("/projects") });
  const { data: domains } = useQuery({ queryKey: ["domains"], queryFn: fetcher("/domains") });
  const { data: solutions } = useQuery({ queryKey: ["solutions"], queryFn: fetcher("/solutions") });
  const { data: sectors } = useQuery({ queryKey: ["sectors"], queryFn: fetcher("/sectors") });
  const { data: technologies } = useQuery({ queryKey: ["technologies"], queryFn: fetcher("/technologies") });
  const { data: articles } = useQuery({ queryKey: ["articles"], queryFn: fetcher("/articles") });
  const { data: methodology, isError: methodologyError } = useQuery({
    queryKey: ["methodology"],
    queryFn: fetcher("/methodology"),
  });

  useSEO({
    title: tr(settings, "seo_title") || t("2Morro Technology Solutions | حلول تقنية متكاملة"),
    description: tr(settings, "seo_description"),
    image: settings?.seo?.og_image_url || settings?.logo_url,
    schema: settings ? {
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "Organization", "name": settings.company_name || "2Morro Technology Solutions", "url": settings.website || window.location.origin, "logo": settings.logo_url || undefined, "email": settings.email || undefined, "telephone": settings.phone || undefined, "address": settings.address ? { "@type": "PostalAddress", "streetAddress": settings.address } : undefined },
        { "@type": "WebSite", "name": settings.company_name || "2Morro Technology Solutions", "url": settings.website || window.location.origin, "inLanguage": ["ar", "en"] }
      ]
    } : undefined,
  });

  const wa = settings?.whatsapp_number
    ? waLink(settings.whatsapp_number, t("مرحبًا، أود الاستفسار عن خدماتكم"))
    : "";
  const hasContact = Boolean(settings?.whatsapp_number || settings?.email);

  return (
    <div className="min-h-screen" data-testid="home-page">
      <Navbar />
      {(servicesError || projectsError || methodologyError) && (
        <div className="container-x pt-6">
          <ApiErrorNotice />
        </div>
      )}
      {(() => {
        const components = {
          hero: <HomeHero settings={settings} wa={wa} />,
          about: <HomeAbout settings={settings} />,
          services: <HomeServices services={services} loading={loadingServices} />,
          domains: <HomeDomains domains={domains} />,
          solutions: <HomeSolutions solutions={solutions} />,
          sectors: <HomeSectors sectors={sectors} />,
          technology: <HomeTechnology technologies={technologies} />,
          knowledge: <HomeKnowledge articles={articles} />,
          why: <HomeWhy />,
          projects: <HomeProjects projects={projects} loading={loadingProjects} />,
          methodology: <HomeMethodology settings={settings} phases={methodology} />,
          quality: <HomeQuality settings={settings} />,
          cta: <HomeCta settings={settings} wa={wa} hasContact={hasContact} />,
        };
        const defaultOrder = ["hero", "about", "domains", "services", "solutions", "sectors", "projects", "technology", "methodology", "why", "quality", "knowledge", "cta"];
        const savedOrder = Array.isArray(settings?.homepage?.sections) ? settings.homepage.sections : [];
        const missingSections = defaultOrder.filter(key => !savedOrder.includes(key) && key !== "cta");
        const order = savedOrder.includes("cta")
          ? [...savedOrder.filter(key => key !== "cta"), ...missingSections, "cta"]
          : [...savedOrder, ...missingSections, "cta"];
        const visible = settings?.homepage?.visible || {};
        return order.filter(key => components[key] && visible[key] !== false).map(key => <div key={key} className="contents">{components[key]}</div>);
      })()}
      <Footer />
    </div>
  );
}
