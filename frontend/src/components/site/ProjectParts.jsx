import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { imgSrc } from "@/lib/api";
import { t, tr } from "@/lib/i18n";

export function ProjectGallery({ urls, name }) {
  const [lightbox, setLightbox] = useState(null);
  if (!urls.length) return null;
  return (
    <div className="mt-10">
      <h2 className="font-heading text-xl font-bold text-slate-900">{t("معرض الصور")}</h2>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {urls.map((u, i) => (
          <button
            key={`${u}-${i}`}
            onClick={() => setLightbox(u)}
            className="group relative overflow-hidden rounded-xl border border-slate-200"
            aria-label={t("عرض الصورة {n}", { n: i + 1 })}
            data-testid={`project-gallery-image-${i}`}
          >
            <img src={imgSrc(u)} alt={t("صورة من مشروع {name} - {n}", { name, n: i + 1 })} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          </button>
        ))}
      </div>
      <Dialog open={Boolean(lightbox)} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent dir="rtl" className="max-w-4xl border-none bg-transparent p-2 shadow-none" showClose={false}>
          <DialogTitle className="sr-only">{t("عرض الصورة بحجم أكبر")}</DialogTitle>
          {lightbox && <img src={imgSrc(lightbox)} alt={t("صورة مكبرة من المشروع")} className="max-h-[80vh] w-full rounded-xl object-contain" data-testid="project-lightbox-image" />}
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 end-4 rounded-full bg-navy-900/80 p-2 text-white transition-colors hover:bg-red-600"
            aria-label={t("إغلاق العرض")}
            data-testid="project-lightbox-close"
          >
            <X className="h-5 w-5" />
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function InfoCard({ icon: Icon, title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
      <h3 className="flex items-center gap-2 font-heading text-base font-bold text-slate-900">
        <Icon className="h-5 w-5 text-electric" />
        {title}
      </h3>
      {children}
    </div>
  );
}

export function RelatedService({ service }) {
  return (
    <div className="rounded-2xl border border-electric/20 bg-electric-50 p-6">
      <h3 className="font-heading text-base font-bold text-slate-900">{t("الخدمة المرتبطة")}</h3>
      <Link to={`/services/${service.slug}`} className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-electric transition-colors hover:text-electric-600" data-testid="project-related-service">
        {tr(service, "name")}
        <ArrowLeft className="h-4 w-4" />
      </Link>
    </div>
  );
}
