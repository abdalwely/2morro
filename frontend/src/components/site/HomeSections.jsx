import { Link } from "react-router-dom";
import { ArrowLeft, MessageCircle, Mail, Compass, Shield, Handshake, Target, CheckCircle2, Route } from "lucide-react";
import Reveal from "@/components/site/Reveal";
import { ServiceCard, ProjectCard } from "@/components/site/Cards";
import { LoadingBlock, SafeImage, HeaderBackground } from "@/components/site/Shared";
import { t, tr } from "@/lib/i18n";

const IMG_HERO = "https://images.unsplash.com/photo-1733412505442-36cfa59a4240?auto=format&fit=crop&w=1000&q=80";
const IMG_WHY = "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?auto=format&fit=crop&w=1200&q=80";
const IMG_QUALITY = "https://images.pexels.com/photos/17489163/pexels-photo-17489163.jpeg?auto=compress&cs=tinysrgb&w=1200";

const VALUES = [
  { icon: Target, title: "جودة التنفيذ", desc: "التزام بالمعايير المتفق عليها في كل تفاصيل المشروع، من أول سطر كود حتى التسليم النهائي." },
  { icon: Compass, title: "منهجية واضحة", desc: "أسلوب عمل مرحلي يوضح لك موقع مشروعك من الخطة في أي وقت، دون مفاجآت." },
  { icon: Shield, title: "أمان وخصوصية", desc: "ممارسات أمنية مدروسة تحمي بياناتك وبيانات عملائك في كل مراحل العمل." },
  { icon: Handshake, title: "شراكة طويلة الأمد", desc: "لا نسلّم المشروع ونختفي؛ نبقى شريك دعم وتطوير مع نمو أعمالك." },
];

const QUALITY_POINTS = [
  "تحليل دقيق للمتطلبات قبل بدء التنفيذ",
  "تنفيذ على مراحل مع نقاط مراجعة واضحة",
  "اختبارات شاملة للأداء والأمان قبل التسليم",
  "دعم ومتابعة بعد التشغيل",
];

export function HomeHero({ settings, wa }) {
  return (
    <section className="relative overflow-hidden bg-navy-900 pb-24 pt-36 sm:pt-44" data-testid="hero-section">
      <HeaderBackground page="home" />
      <div className="grid-pattern absolute inset-0" aria-hidden="true" />
      <div className="absolute -top-24 start-1/4 h-96 w-96 rounded-full bg-electric/25 blur-[130px]" aria-hidden="true" />
      <div className="absolute bottom-0 end-0 h-72 w-72 rounded-full bg-aqua/10 blur-[110px]" aria-hidden="true" />
      <div className="container-x relative grid items-center gap-14 lg:grid-cols-[1.15fr_1fr]">
        <div className="max-w-3xl">
          <Reveal>
            <span className="chip border-aqua/30 bg-aqua/10 text-aqua" data-testid="hero-badge">
              <SparklesDot />
              {t("شركة حلول تقنية متكاملة")}
            </span>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.25] text-white sm:text-5xl lg:text-6xl" data-testid="hero-title">
              {tr(settings, "hero_title") || t("نبني حلولاً تقنية تدفع أعمالك إلى الأمام")}
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg" data-testid="hero-subtitle">
              {tr(settings, "hero_subtitle") || ""}
            </p>
          </Reveal>
          <Reveal delay={300}>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/services" className="btn-primary" data-testid="hero-services-button">
                {t("استكشف خدماتنا")}
                <ArrowLeft className="h-4 w-4" />
              </Link>
              {wa ? (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-ghost-light" data-testid="hero-whatsapp-button">
                  <MessageCircle className="h-4 w-4" />
                  {t("تواصل عبر واتساب")}
                </a>
              ) : (
                <Link to="/contact" className="btn-ghost-light" data-testid="hero-contact-button">
                  <Mail className="h-4 w-4" />
                  {t("تواصل معنا")}
                </Link>
              )}
            </div>
          </Reveal>
          <Reveal delay={400}>
            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3">
              {[t("منهجية تنفيذ واضحة"), t("التزام صارم بالجودة"), t("دعم فني متواصل")].map((t) => (
                <span key={t} className="flex items-center gap-2 text-sm font-medium text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-aqua" />
                  {t}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
        <Reveal delay={250} className="hidden lg:block">
          <div className="relative" data-testid="hero-visual">
            <div className="absolute -inset-3 rounded-[28px] border border-electric/20" aria-hidden="true" />
            <div className="overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-electric/10">
              <img src={IMG_HERO} alt={t("شاشة تعرض شيفرة برمجية لمشروع تقني")} className="aspect-[4/5] w-full object-cover opacity-90" loading="eager" />
            </div>
            <div className="absolute -bottom-6 start-6 rounded-2xl border border-white/10 bg-navy-800/90 px-5 py-4 backdrop-blur-xl">
              <p className="text-xs text-slate-400">{t("من الفكرة إلى التشغيل")}</p>
              <p className="mt-1 font-heading text-lg font-bold text-white">{t("تحليل · تطوير · دعم")}</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function HomeServices({ services, loading }) {
  return (
    <section className="py-20 sm:py-24" data-testid="home-services-section">
      <div className="container-x">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="chip border-electric/20 bg-electric-50 text-electric">{t("خدماتنا")}</span>
              <h2 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">{t("حلول تقنية تغطي احتياجات أعمالك")}</h2>
              <p className="mt-3 max-w-xl leading-relaxed text-slate-600">
                {t("من التصميم والتطوير إلى التشغيل والدعم، نقدم مجموعة متكاملة من الخدمات التقنية الاحترافية.")}
              </p>
            </div>
            <Link to="/services" className="btn-outline" data-testid="home-all-services-button">
              {t("جميع الخدمات")}
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
        {loading ? (
          <LoadingBlock />
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(services || []).slice(0, 6).map((s, i) => (
              <Reveal key={s.id} delay={i * 60}>
                <ServiceCard service={s} index={i} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function HomeWhy() {
  return (
    <section className="bg-white py-20 sm:py-24" data-testid="home-why-section">
      <div className="container-x grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-2xl shadow-navy-900/10">
              <SafeImage src={IMG_WHY} alt={t("فريق تقني يعمل على حلول رقمية")} className="aspect-[4/3] w-full object-cover" />
            </div>
            <div className="absolute -bottom-5 -start-5 hidden rounded-2xl bg-electric p-5 text-white shadow-xl sm:block">
              <Route className="h-7 w-7" />
              <div className="mt-2 font-heading text-sm font-bold">{t("منهجية مرحلية واضحة")}</div>
              <div className="text-xs text-white/80">{t("من التحليل حتى الدعم")}</div>
            </div>
          </div>
        </Reveal>
        <div>
          <Reveal>
            <span className="chip border-electric/20 bg-electric-50 text-electric">{t("لماذا نحن؟")}</span>
            <h2 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">{t("شريك تقني يفهم أعمالك قبل أن يكتب سطر كود")}</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              {t("نؤمن أن الحل التقني الناجح يبدأ من فهم عميق لطبيعة نشاطك وأهدافك، ثم يُبنى بمنهجية منظمة وجودة ملتزمة بها.")}
            </p>
          </Reveal>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 70}>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 transition-all duration-300 hover:border-electric/30 hover:bg-white hover:shadow-lg hover:shadow-electric/5" data-testid={`home-value-${i}`}>
                  <v.icon className="h-7 w-7 text-electric" />
                  <h3 className="mt-3 font-heading text-base font-bold text-slate-900">{t(v.title)}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{t(v.desc)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomeProjects({ projects, loading }) {
  return (
    <section className="py-20 sm:py-24" data-testid="home-projects-section">
      <div className="container-x">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="chip border-electric/20 bg-electric-50 text-electric">{t("أعمالنا")}</span>
              <h2 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">{t("مشاريع مختارة")}</h2>
              <p className="mt-3 max-w-xl leading-relaxed text-slate-600">{t("نماذج من طبيعة الحلول التي نصممها ونطورها لعملائنا.")}</p>
            </div>
            <Link to="/projects" className="btn-outline" data-testid="home-all-projects-button">
              {t("جميع المشاريع")}
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
        {loading ? (
          <LoadingBlock />
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(projects || []).slice(0, 6).map((p, i) => (
              <Reveal key={p.id} delay={i * 60}>
                <ProjectCard project={p} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function HomeMethodology({ settings, models }) {
  return (
    <section className="relative overflow-hidden bg-navy-900 py-20 sm:py-24" data-testid="home-methodology-section">
      <div className="grid-pattern absolute inset-0" aria-hidden="true" />
      <div className="container-x relative">
        <Reveal>
          <div className="max-w-2xl">
            <span className="chip border-aqua/30 bg-aqua/10 text-aqua">{t("منهجية العمل")}</span>
            <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl lg:text-4xl">{t("رحلة واضحة من الفكرة إلى التشغيل")}</h2>
            <p className="mt-3 leading-relaxed text-slate-300">{tr(settings, "methodology_content") || ""}</p>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {(models || []).slice(0, 5).map((m, i) => (
            <Reveal key={m.id} delay={i * 80}>
              <div className="relative h-full rounded-xl border border-white/10 bg-navy-700/60 p-5 backdrop-blur-sm transition-all duration-300 hover:border-aqua/40" data-testid={`home-methodology-step-${i}`}>
                <span className="font-heading text-3xl font-black text-electric/60">0{i + 1}</span>
                <h3 className="mt-3 font-heading text-base font-bold text-white">{tr(m, "name")}</h3>
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-400">{tr(m, "short_desc")}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <Link to="/models" className="mt-10 inline-flex items-center gap-2 text-sm font-bold text-aqua transition-colors hover:text-white" data-testid="home-all-models-link">
            {t("استعرض نماذج التنفيذ كاملة")}
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

export function HomeQuality({ settings }) {
  return (
    <section className="py-20 sm:py-24" data-testid="home-quality-section">
      <div className="container-x grid items-center gap-12 lg:grid-cols-2">
        <div>
          <Reveal>
            <span className="chip border-electric/20 bg-electric-50 text-electric">{t("الجودة والتنفيذ")}</span>
            <h2 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">{t("الجودة ليست مرحلة… بل أسلوب عمل")}</h2>
            <p className="mt-4 leading-relaxed text-slate-600">{tr(settings, "quality_content") || ""}</p>
          </Reveal>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {QUALITY_POINTS.map((q, i) => (
              <Reveal key={q} delay={i * 60}>
                <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-4" data-testid={`home-quality-point-${i}`}>
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-electric" />
                  <span className="text-sm font-medium leading-relaxed text-slate-700">{t(q)}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <Reveal delay={100}>
          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-2xl shadow-navy-900/10">
            <SafeImage src={IMG_QUALITY} alt={t("بنية تحتية تقنية متطورة")} className="aspect-[4/3] w-full object-cover" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function HomeCta({ settings, wa, hasContact }) {
  return (
    <section className="relative overflow-hidden bg-navy-800 py-20" data-testid="home-cta-section">
      <div className="absolute -top-20 left-1/3 h-72 w-72 rounded-full bg-electric/20 blur-[120px]" aria-hidden="true" />
      <div className="container-x relative text-center">
        <Reveal>
          <h2 className="mx-auto max-w-2xl text-2xl font-bold text-white sm:text-3xl lg:text-4xl">{t("هل لديك فكرة مشروع تقني؟ لنحوّلها إلى واقع")}</h2>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-slate-300">
            {t("تواصل معنا اليوم ونناقش معك كيف يمكن لحلولنا التقنية أن تخدم أهداف أعمالك.")}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-primary" data-testid="home-cta-whatsapp">
                <MessageCircle className="h-4 w-4" />
                {t("تواصل عبر واتساب")}
              </a>
            )}
            {settings?.email && (
              <a href={`mailto:${settings.email}`} className="btn-ghost-light" data-testid="home-cta-email">
                <Mail className="h-4 w-4" />
                {t("راسلنا عبر البريد")}
              </a>
            )}
            {!hasContact && (
              <Link to="/contact" className="btn-primary" data-testid="home-cta-contact">
                {t("تواصل معنا")}
                <ArrowLeft className="h-4 w-4" />
              </Link>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function SparklesDot() {
  return <span className="h-1.5 w-1.5 rounded-full bg-aqua" aria-hidden="true" />;
}
