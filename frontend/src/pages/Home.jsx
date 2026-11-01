import { useQuery } from "@tanstack/react-query";
import api, { waLink } from "@/lib/api";
import { useSEO } from "@/hooks/useSEO";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import {
  HomeHero,
  HomeServices,
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
  const { data: models, isError: modelsError } = useQuery({
    queryKey: ["models"],
    queryFn: fetcher("/delivery-models"),
  });

  useSEO({
    title:
      tr(settings, "seo_title") ||
      t("2Morro Technically Solutions | حلول تقنية متكاملة"),
    description: tr(settings, "seo_description"),
  });

  const wa = settings?.whatsapp_number
    ? waLink(settings.whatsapp_number, t("مرحبًا، أود الاستفسار عن خدماتكم"))
    : "";
  const hasContact = Boolean(settings?.whatsapp_number || settings?.email);

  return (
    <div className="min-h-screen" data-testid="home-page">
      <Navbar />
      {(servicesError || projectsError || modelsError) && (
        <div className="container-x pt-6">
          <ApiErrorNotice />
        </div>
      )}
      <HomeHero settings={settings} wa={wa} />
      <HomeServices services={services} loading={loadingServices} />
      <HomeWhy />
      <HomeProjects projects={projects} loading={loadingProjects} />
      <HomeMethodology settings={settings} models={models} />
      <HomeQuality settings={settings} />
      <HomeCta settings={settings} wa={wa} hasContact={hasContact} />
      <Footer />
    </div>
  );
}
