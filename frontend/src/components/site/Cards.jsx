import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getIcon } from "@/lib/icons";
import { imgSrc } from "@/lib/api";
import { DemoBadge } from "./Shared";
import { t, tr } from "@/lib/i18n";

export function ServiceCard({ service, index = 0 }) {
  const Icon = getIcon(service.icon);
  return (
    <Link
      to={`/services/${service.slug}`}
      data-testid={`service-card-${service.id}`}
      className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-electric/40 hover:shadow-xl hover:shadow-electric/10"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-start justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-electric-50 text-electric transition-colors duration-300 group-hover:bg-electric group-hover:text-white">
          <Icon className="h-6 w-6" />
        </span>
        {service.is_demo && <DemoBadge />}
      </div>
      <h3 className="mt-5 font-heading text-lg font-bold text-slate-900 transition-colors group-hover:text-electric">{tr(service, "name")}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{tr(service, "short_desc")}</p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-electric">
        {t("اعرف المزيد")}
        <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
      </span>
    </Link>
  );
}

export function ProjectCard({ project }) {
  return (
    <Link
      to={`/projects/${project.slug}`}
      data-testid={`project-card-${project.id}`}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-electric/40 hover:shadow-xl hover:shadow-electric/10"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-navy-800">
        {project.main_image_url && (
          <img
            src={imgSrc(project.main_image_url)}
            alt={tr(project, "name")}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900/70 via-transparent to-transparent" />
        {tr(project, "category") && (
          <span className="absolute top-3 start-3 chip border-white/20 bg-navy-900/70 text-white backdrop-blur-sm">{tr(project, "category")}</span>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-heading text-lg font-bold text-slate-900 transition-colors group-hover:text-electric">{tr(project, "name")}</h3>
          {project.is_demo && <DemoBadge />}
        </div>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">{tr(project, "short_desc")}</p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-electric">
          {t("تفاصيل المشروع")}
          <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
