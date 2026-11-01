import { imgSrc } from "@/lib/api";
import { useSettings } from "@/lib/theme";
import { t, getLang, trPage } from "@/lib/i18n";

export function HeaderBackground({ page }) {
  const { data: settings } = useSettings();
  const bg = settings?.theme?.backgrounds;
  if (!bg?.[page]) return null;
  return (
    <>
      <img
        src={imgSrc(bg[page])}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
        data-testid={`header-bg-${page}`}
      />
      <div
        className="absolute inset-0 bg-navy-900"
        style={{ opacity: (bg.overlay ?? 70) / 100 }}
        aria-hidden="true"
      />
    </>
  );
}

export function PageHeader({
  page,
  title: titleProp,
  subtitle: subtitleProp,
  badge: badgeProp,
}) {
  const { data: settings } = useSettings();
  const title = trPage(settings, page, "title") || titleProp;
  const subtitle = trPage(settings, page, "subtitle") || subtitleProp;
  const badge = trPage(settings, page, "badge") || badgeProp;
  return (
    <header className="relative overflow-hidden bg-navy-900 pt-32 pb-16 sm:pt-40 sm:pb-20">
      <HeaderBackground page={page} />
      <div className="grid-pattern absolute inset-0" aria-hidden="true" />
      <div
        className="absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-electric/25 blur-[110px]"
        aria-hidden="true"
      />
      <div className="container-x relative">
        {badge && (
          <span
            className="chip mb-4 border-aqua/30 bg-aqua/10 text-aqua"
            data-testid="page-header-badge"
          >
            {badge}
          </span>
        )}
        <h1
          className="max-w-3xl text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl"
          data-testid="page-header-title"
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            {subtitle}
          </p>
        )}
      </div>
    </header>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  desc,
  dark = false,
  center = false,
}) {
  return (
    <div className={`max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && (
        <span
          className={`chip ${dark ? "border-aqua/30 bg-aqua/10 text-aqua" : "border-electric/20 bg-electric-50 text-electric"}`}
        >
          {eyebrow}
        </span>
      )}
      <h2
        className={`mt-4 text-2xl font-bold sm:text-3xl lg:text-4xl ${dark ? "text-white" : "text-slate-900"}`}
      >
        {title}
      </h2>
      {desc && (
        <p
          className={`mt-3 leading-relaxed ${dark ? "text-slate-300" : "text-slate-600"}`}
        >
          {desc}
        </p>
      )}
    </div>
  );
}

export function LoadingBlock({ dark = false }) {
  return (
    <div
      className="flex items-center justify-center py-24"
      data-testid="loading-block"
    >
      <div
        className={`h-10 w-10 animate-spin rounded-full border-[3px] ${dark ? "border-aqua" : "border-electric"} border-t-transparent`}
      />
      <span
        className={`ms-4 text-sm ${dark ? "text-slate-300" : "text-slate-500"}`}
      >
        {t("جارٍ التحميل…")}
      </span>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, desc, dark = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-16 text-center ${dark ? "border-white/15 bg-white/5" : "border-slate-300 bg-slate-50"}`}
      data-testid="empty-state"
    >
      {Icon && (
        <Icon
          className={`mb-4 h-12 w-12 ${dark ? "text-aqua/60" : "text-electric/40"}`}
        />
      )}
      <h3
        className={`text-lg font-bold ${dark ? "text-white" : "text-slate-800"}`}
      >
        {title}
      </h3>
      {desc && (
        <p
          className={`mt-2 max-w-md text-sm leading-relaxed ${dark ? "text-slate-400" : "text-slate-500"}`}
        >
          {desc}
        </p>
      )}
    </div>
  );
}

export function ApiErrorNotice({ message }) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-800"
      data-testid="api-error-notice"
    >
      {message ||
        t(
          "تعذر تحميل البيانات من الخادم. تحقق من تشغيل Backend واتصال الشبكة، ثم أعد تحميل الصفحة.",
        )}
    </div>
  );
}

export function DemoBadge() {
  return (
    <span
      className="chip border-amber-300/60 bg-amber-50 text-amber-700"
      title={t(
        "هذا عنصر تجريبي يمكن للمسؤول تعديله أو استبداله من لوحة التحكم",
      )}
    >
      {t("تجريبي")}
    </span>
  );
}

export function SafeImage({ src, alt, className = "", loading = "lazy" }) {
  if (!src) return null;
  return (
    <img
      src={imgSrc(src)}
      alt={alt || ""}
      loading={loading}
      className={className}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}

export function ItemMeta({ createdAt, updatedAt, dark = false }) {
  if (!createdAt) return null;
  return (
    <span className={`text-xs ${dark ? "text-slate-400" : "text-slate-400"}`}>
      {t("أُنشئ في {date}", { date: fmtDateStr(createdAt) })}
      {updatedAt && updatedAt !== createdAt
        ? t(" • آخر تحديث {date}", { date: fmtDateStr(updatedAt) })
        : ""}
    </span>
  );
}

export function fmtDateStr(iso) {
  try {
    return new Date(iso).toLocaleDateString(
      getLang() === "en" ? "en-GB" : "ar",
      { year: "numeric", month: "long", day: "numeric" },
    );
  } catch {
    return "";
  }
}
