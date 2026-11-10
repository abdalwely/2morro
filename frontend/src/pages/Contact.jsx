import { toast } from "sonner";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Mail, Copy, Check, Linkedin, Twitter, Instagram, Github, Info } from "lucide-react";
import api, { waLink } from "@/lib/api";
import { useSEO } from "@/hooks/useSEO";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { PageHeader } from "@/components/site/Shared";
import { t, getLang, trPage } from "@/lib/i18n";

const SOCIALS = [
  { key: "linkedin", icon: Linkedin, label: "لينكدإن" },
  { key: "twitter", icon: Twitter, label: "إكس (تويتر)" },
  { key: "instagram", icon: Instagram, label: "إنستغرام" },
  { key: "github", icon: Github, label: "جيت هب" },
];

function WhatsAppCard({ href, number }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="contact-whatsapp-card"
      className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-10 text-center transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/10"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition-transform duration-300 group-hover:scale-110">
        <MessageCircle className="h-8 w-8" />
      </span>
      <h2 className="mt-5 font-heading text-xl font-bold text-slate-900">{t("تواصل عبر واتساب")}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{t("يمكنك فتح محادثة مباشرة مع فريقنا على واتساب في أي وقت.")}</p>
      <span dir="ltr" className="mt-3 text-sm font-bold text-slate-800">{number}</span>
      <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white transition-colors group-hover:bg-emerald-600">
        <MessageCircle className="h-4 w-4" />
        {t("افتح المحادثة")}
      </span>
    </a>
  );
}

function EmailCard({ email }) {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy email", error);
      toast.error(t("تعذر نسخ البريد، يرجى نسخه يدويًا"));
    }
  };

  return (
    <div
      data-testid="contact-email-card"
      className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-10 text-center transition-all duration-300 hover:-translate-y-1 hover:border-electric/40 hover:shadow-xl hover:shadow-electric/10"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-electric text-white shadow-lg shadow-electric/30 transition-transform duration-300 group-hover:scale-110">
        <Mail className="h-8 w-8" />
      </span>
      <h2 className="mt-5 font-heading text-xl font-bold text-slate-900">{t("راسلنا عبر البريد")}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{t("أرسل استفسارك أو متطلباتك إلى بريدنا الرسمي وسنرد عليك في أقرب وقت.")}</p>
      <span dir="ltr" className="mt-3 text-sm font-bold text-slate-800">{email}</span>
      <div className="mt-5 flex gap-2">
        <a href={`mailto:${email}`} className="inline-flex items-center gap-2 rounded-full bg-electric px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-electric-600" data-testid="contact-email-button">
          <Mail className="h-4 w-4" />
          {t("افتح تطبيق البريد")}
        </a>
        <button
          onClick={copyEmail}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:border-electric hover:text-electric"
          data-testid="contact-copy-email-button"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          {copied ? t("تم النسخ") : t("نسخ البريد")}
        </button>
      </div>
    </div>
  );
}

function SocialLinks({ social }) {
  const links = SOCIALS.filter((s) => social?.[s.key]);
  if (!links.length) return null;
  return (
    <div className="mx-auto mt-12 max-w-4xl text-center" data-testid="contact-socials">
      <h3 className="font-heading text-lg font-bold text-slate-900">{t("تابعنا على منصات التواصل")}</h3>
      <div className="mt-5 flex justify-center gap-3">
        {links.map(({ key, icon: Icon, label }) => {
          const url = social[key];
          return (
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t(label)}
              title={t(label)}
              className="rounded-xl border border-slate-200 bg-white p-3.5 text-slate-500 transition-all duration-300 hover:-translate-y-1 hover:border-electric/40 hover:text-electric"
              data-testid={`contact-social-${key}`}
            >
              <Icon className="h-5 w-5" />
            </a>
          );
        })}
      </div>
    </div>
  );
}


function WhatsAppMessageForm({ number }) {
  const [values, setValues] = useState({ name: "", email: "", phone: "", message: "" });
  const submit = (event) => {
    event.preventDefault();
    if (!number) { toast.error(t("رقم واتساب غير متاح حاليًا")); return; }
    if (!values.name.trim() || !values.message.trim()) { toast.error(t("يرجى إدخال الاسم والرسالة")); return; }
    const lines = [
      t("رسالة تواصل جديدة إلى 2Morro Technology Solutions"),
      `${t("الاسم")}: ${values.name.trim()}`,
      values.email.trim() ? `${t("البريد الإلكتروني")}: ${values.email.trim()}` : "",
      values.phone.trim() ? `${t("رقم الهاتف")}: ${values.phone.trim()}` : "",
      `${t("الرسالة")}: ${values.message.trim()}`,
    ].filter(Boolean);
    const url = waLink(number, lines.join("\n"));
    window.open(url, "_blank", "noopener,noreferrer");
  };
  return <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" data-testid="contact-whatsapp-form">
    <div className="mb-5"><h2 className="text-xl font-bold text-slate-900">{t("أرسل رسالة عبر واتساب")}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{t("اكتب بياناتك ورسالتك، وسنجهزها لك في واتساب لإرسالها مباشرة. لا يتم حفظ النموذج في الموقع.")}</p></div>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block"><span className="mb-1.5 block text-sm font-semibold">{t("الاسم")} *</span><input required value={values.name} onChange={e => setValues({ ...values, name: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-electric" /></label>
      <label className="block"><span className="mb-1.5 block text-sm font-semibold">{t("البريد الإلكتروني")}</span><input type="email" dir="ltr" value={values.email} onChange={e => setValues({ ...values, email: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-electric" /></label>
      <label className="block sm:col-span-2"><span className="mb-1.5 block text-sm font-semibold">{t("رقم الهاتف")}</span><input dir="ltr" value={values.phone} onChange={e => setValues({ ...values, phone: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-electric" /></label>
      <label className="block sm:col-span-2"><span className="mb-1.5 block text-sm font-semibold">{t("الرسالة")} *</span><textarea required rows={5} value={values.message} onChange={e => setValues({ ...values, message: e.target.value })} className="w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 text-sm leading-7 outline-none focus:border-electric" /></label>
    </div>
    <button type="submit" className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"><MessageCircle className="h-4 w-4" />{t("تجهيز الرسالة وفتح واتساب")}</button>
  </form>;
}

function BusinessHours({ hours }) {
  if (!hours?.configured || !hours?.days?.length) return null;
  return <section className="mx-auto mt-8 max-w-4xl rounded-2xl border border-slate-200 bg-slate-50 p-6" data-testid="contact-business-hours">
    <h2 className="text-lg font-bold text-slate-900">{t("أيام وساعات العمل")}</h2>
    <p className="mt-1 text-xs leading-6 text-slate-500">{t("الأوقات المعروضة معلومات إرشادية فقط، ويمكنك مراسلتنا عبر واتساب في أي وقت.")}</p>
    {hours.timezone && <p className="mt-1 text-xs text-slate-500">{t("المنطقة الزمنية")}: <span dir="ltr">{hours.timezone}</span></p>}
    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{hours.days.map(day => <div key={day.day} className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm"><span className="font-semibold text-slate-700">{getLang() === "en" ? day.label_en : day.label_ar}</span><span className={day.enabled ? "text-slate-600" : "text-slate-400"}>{day.enabled ? `${day.open || ""} – ${day.close || ""}` : t("مغلق")}</span></div>)}</div>
  </section>;
}

export default function Contact() {
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: () => api.get("/settings").then((r) => r.data) });
  useSEO({
    title: `${trPage(settings, "contact", "title") || t("تواصل معنا")} | 2Morro Technology Solutions`,
    description: trPage(settings, "contact", "subtitle") || t("تواصل مع شركة 2Morro Technology Solutions عبر واتساب أو البريد الإلكتروني الرسمي."),
    image: settings?.seo?.og_image_url || settings?.logo_url,
  });

  const wa = settings?.whatsapp_number ? waLink(settings.whatsapp_number, t("مرحبًا، أود التواصل معكم")) : "";
  const hasAny = Boolean(wa || settings?.email);

  return (
    <div className="min-h-screen" data-testid="contact-page">
      <Navbar />
      <PageHeader
        page="contact"
        badge={t("تواصل معنا")}
        title={t("يسعدنا تواصلك معنا")}
        subtitle={t("نستقبل استفساراتك وطلباتك مباشرة عبر واتساب والبريد الإلكتروني الرسميين.")}
      />

      <section className="py-16 sm:py-20">
        <div className="container-x">
          {!hasAny && (
            <div className="mb-10 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800" data-testid="contact-empty-notice">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{t("لم تُضف بيانات التواصل الرسمية بعد — يمكن لمسؤول الموقع إضافة رابط واتساب والبريد الإلكتروني وحسابات التواصل من لوحة التحكم.")}</span>
            </div>
          )}

          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
            {wa && <WhatsAppCard href={wa} number={settings.whatsapp_number} />}
            {settings?.email && <EmailCard email={settings.email} />}
          </div>

          {wa && <div className="mx-auto mt-8 max-w-4xl"><WhatsAppMessageForm number={settings.whatsapp_number} /></div>}
          <BusinessHours hours={settings?.business_hours} />
          <SocialLinks social={settings?.social} />
        </div>
      </section>

      <Footer />
    </div>
  );
}
