import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, FileText, MessageCircle, Share2, Search, Save } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import { Field, inputCls, ImageUploader, DynamicList } from "@/components/admin/AdminUI";
import { toast } from "sonner";
import { EnglishTextsCard, PageTextsCard, CopyrightCard, DefaultsCard } from "@/pages/admin/SettingsExtras";

const EMPTY = {
  company_name: "", tagline: "", hero_title: "", hero_subtitle: "",
  about_short: "", about_content: "", mission: "", vision: "", values: [],
  quality_content: "", methodology_content: "", email: "", whatsapp_number: "",
  social: { linkedin: "", twitter: "", instagram: "", github: "" },
  footer_text: "", logo_url: "", seo_title: "", seo_description: "",
  en: {}, pages: {}, seo: { default_title: "", default_description: "", og_image_url: "" }, copyright_text: "", copyright_text_en: "",
  founding_date: "", address: "", phone: "", website: "", company_profile_pdf_url: "",
  privacy_policy: { ar: "", en: "" }, terms: { ar: "", en: "" },
  homepage: { sections: ["hero", "about", "domains", "services", "solutions", "sectors", "projects", "technology", "methodology", "why", "quality", "knowledge", "cta"], visible: {} },
  business_hours: { configured: false, timezone: "Asia/Aden", days: [
    { day: "sunday", label_ar: "الأحد", label_en: "Sunday", enabled: false, open: "", close: "" },
    { day: "monday", label_ar: "الإثنين", label_en: "Monday", enabled: false, open: "", close: "" },
    { day: "tuesday", label_ar: "الثلاثاء", label_en: "Tuesday", enabled: false, open: "", close: "" },
    { day: "wednesday", label_ar: "الأربعاء", label_en: "Wednesday", enabled: false, open: "", close: "" },
    { day: "thursday", label_ar: "الخميس", label_en: "Thursday", enabled: false, open: "", close: "" },
    { day: "friday", label_ar: "الجمعة", label_en: "Friday", enabled: false, open: "", close: "" },
    { day: "saturday", label_ar: "السبت", label_en: "Saturday", enabled: false, open: "", close: "" },
  ] },
};

const HOMEPAGE_SECTIONS = [
  ["hero", "الواجهة الرئيسية"], ["about", "التعريف بالشركة"], ["domains", "المجالات التقنية"],
  ["services", "الخدمات"], ["solutions", "الحلول المتكاملة"], ["sectors", "القطاعات"],
  ["projects", "المشاريع المختارة"], ["technology", "منظومة التقنيات"], ["methodology", "منهجية العمل"],
  ["why", "لماذا 2Morro؟"], ["quality", "الجودة والتنفيذ"], ["knowledge", "المقالات والموارد"], ["cta", "دعوة التواصل"],
];

function Card({ icon: Icon, title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-slate-900">
        <Icon className="h-5 w-5 text-electric" />
        {title}
      </h2>
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

export default function SettingsAdmin() {
  const { data, isLoading } = useQuery({ queryKey: ["settings"], queryFn: () => api.get("/settings").then((r) => r.data) });
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const load = (d) => setForm({
    ...EMPTY, ...d, values: d.values || [], social: { ...EMPTY.social, ...(d.social || {}) },
    homepage: { ...EMPTY.homepage, ...(d.homepage || {}), sections: (() => { const saved = Array.isArray(d.homepage?.sections) ? d.homepage.sections : []; const missing = EMPTY.homepage.sections.filter(key => !saved.includes(key) && key !== "cta"); return saved.includes("cta") ? [...saved.filter(key => key !== "cta"), ...missing, "cta"] : [...saved, ...missing, "cta"]; })(), visible: { ...(d.homepage?.visible || {}) } },
    business_hours: { ...EMPTY.business_hours, ...(d.business_hours || {}), days: d.business_hours?.days || EMPTY.business_hours.days },
  });

  useEffect(() => {
    if (data) load(data);
  }, [data]);

  const submit = async (e) => {
    e.preventDefault();
    if (form.business_hours?.configured) {
      const invalidDay = (form.business_hours.days || []).find(day => day.enabled && (!day.open || !day.close || day.open >= day.close));
      if (invalidDay) { toast.error(`أدخل وقت بداية ونهاية صحيحين ليوم ${invalidDay.label_ar}.`); return; }
    }
    setSaving(true);
    try {
      const { data: saved } = await api.put("/admin/settings", form);
      load(saved);
      await qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("تم حفظ بيانات الشركة بنجاح — ستظهر التغييرات على الموقع مباشرة");
    } catch (err) {
      toast.error(formatApiError(err));
    }
    setSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24" data-testid="admin-settings-loading">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-electric border-t-transparent" />
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate data-testid="admin-settings-page">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900">بيانات الشركة</h1>
          <p className="mt-1 text-sm text-slate-500">إدارة هوية الموقع ومحتواه وبيانات التواصل وSEO.</p>
        </div>
        <button type="submit" disabled={saving} className="btn-primary !px-5 !py-2.5 !text-xs disabled:opacity-60" data-testid="admin-settings-save-button">
          <Save className="h-4 w-4" />
          {saving ? "جارٍ الحفظ…" : "حفظ التغييرات"}
        </button>
      </div>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-2">
        <Card icon={Building2} title="الهوية والنبذة">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="اسم الشركة">
              <input className={inputCls} value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} data-testid="admin-settings-company-name" />
            </Field>
            <Field label="الشعار النصي / الوصف القصير">
              <input className={inputCls} value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} data-testid="admin-settings-tagline" />
            </Field>
          </div>
          <ImageUploader value={form.logo_url} onChange={(u) => setForm({ ...form, logo_url: u })} label="شعار الشركة (اختياري)" testid="admin-settings-logo" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="تاريخ التأسيس"><input type="date" className={inputCls} value={form.founding_date || ""} onChange={e => setForm({ ...form, founding_date: e.target.value })} /></Field>
            <Field label="المقر الرئيسي"><input className={inputCls} value={form.address || ""} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="سيئون، حضرموت، اليمن" /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="رقم الهاتف"><input dir="ltr" className={inputCls} value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="الموقع الإلكتروني"><input dir="ltr" className={inputCls} value={form.website || ""} onChange={e => setForm({ ...form, website: e.target.value })} /></Field>
          </div>
          <Field label="رابط الملف التعريفي PDF"><input dir="ltr" className={inputCls} value={form.company_profile_pdf_url || ""} onChange={e => setForm({ ...form, company_profile_pdf_url: e.target.value })} placeholder="https://... أو رابط ملف مرفوع" /></Field>
          <Field label="عنوان الصفحة الرئيسية">
            <input className={inputCls} value={form.hero_title} onChange={(e) => setForm({ ...form, hero_title: e.target.value })} data-testid="admin-settings-hero-title" />
          </Field>
          <Field label="وصف الصفحة الرئيسية">
            <textarea className={`${inputCls} min-h-[90px]`} value={form.hero_subtitle} onChange={(e) => setForm({ ...form, hero_subtitle: e.target.value })} data-testid="admin-settings-hero-subtitle" />
          </Field>
        </Card>

        <Card icon={FileText} title="صفحة من نحن">
          <Field label="النبذة المختصرة">
            <input className={inputCls} value={form.about_short} onChange={(e) => setForm({ ...form, about_short: e.target.value })} data-testid="admin-settings-about-short" />
          </Field>
          <Field label="محتوى صفحة من نحن" hint="كل سطر جديد يظهر كفقرة مستقلة">
            <textarea className={`${inputCls} min-h-[180px]`} value={form.about_content} onChange={(e) => setForm({ ...form, about_content: e.target.value })} data-testid="admin-settings-about-content" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="الرؤية">
              <textarea className={`${inputCls} min-h-[90px]`} value={form.vision} onChange={(e) => setForm({ ...form, vision: e.target.value })} data-testid="admin-settings-vision" />
            </Field>
            <Field label="الرسالة">
              <textarea className={`${inputCls} min-h-[90px]`} value={form.mission} onChange={(e) => setForm({ ...form, mission: e.target.value })} data-testid="admin-settings-mission" />
            </Field>
          </div>
          <Field label="القيم المهنية">
            <DynamicList items={form.values} onChange={(v) => setForm({ ...form, values: v })} placeholder="مثال: الالتزام بالجودة والمواعيد" testid="admin-settings-values" />
          </Field>
        </Card>

        <Card icon={MessageCircle} title="التواصل الرسمي">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="البريد الإلكتروني الرسمي">
              <input dir="ltr" type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="info@example.com" data-testid="admin-settings-email" />
            </Field>
            <Field label="رقم واتساب" hint="بصيغة دولية بدون + مثال: 9677XXXXXXXX">
              <input dir="ltr" className={inputCls} value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} placeholder="9665XXXXXXXX" data-testid="admin-settings-whatsapp" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="لينكدإن">
              <input dir="ltr" className={inputCls} value={form.social.linkedin} onChange={(e) => setForm({ ...form, social: { ...form.social, linkedin: e.target.value } })} data-testid="admin-settings-linkedin" />
            </Field>
            <Field label="إكس (تويتر)">
              <input dir="ltr" className={inputCls} value={form.social.twitter} onChange={(e) => setForm({ ...form, social: { ...form.social, twitter: e.target.value } })} data-testid="admin-settings-twitter" />
            </Field>
            <Field label="إنستغرام">
              <input dir="ltr" className={inputCls} value={form.social.instagram} onChange={(e) => setForm({ ...form, social: { ...form.social, instagram: e.target.value } })} data-testid="admin-settings-instagram" />
            </Field>
            <Field label="جيت هب">
              <input dir="ltr" className={inputCls} value={form.social.github} onChange={(e) => setForm({ ...form, social: { ...form.social, github: e.target.value } })} data-testid="admin-settings-github" />
            </Field>
          </div>
          <Field label="نص التذييل">
            <textarea className={`${inputCls} min-h-[70px]`} value={form.footer_text} onChange={(e) => setForm({ ...form, footer_text: e.target.value })} data-testid="admin-settings-footer" />
          </Field>
        </Card>

        <Card icon={MessageCircle} title="أيام وساعات العمل">
          <p className="text-xs leading-6 text-slate-500">هذه البيانات للعرض المعلوماتي فقط. لا يتم تعطيل واتساب أو منع إرسال الرسائل خارج أوقات العمل.</p>
          <Field label="المنطقة الزمنية"><input dir="ltr" className={inputCls} value={form.business_hours?.timezone || "Asia/Aden"} onChange={e => setForm({ ...form, business_hours: { ...(form.business_hours || {}), timezone: e.target.value } })} /></Field>
          <div className="space-y-2">
            {(form.business_hours?.days || EMPTY.business_hours.days).map((day, index) => <div key={day.day} className="grid grid-cols-[auto_1fr_1fr_1fr] items-center gap-2 rounded-xl border border-slate-200 p-3">
              <input aria-label={`تفعيل ${day.label_ar}`} type="checkbox" checked={Boolean(day.enabled)} onChange={e => { const days = [...form.business_hours.days]; days[index] = { ...day, enabled: e.target.checked }; setForm({ ...form, business_hours: { ...form.business_hours, configured: true, days } }); }} />
              <span className="text-sm font-semibold">{day.label_ar}</span>
              <Field label="من"><input type="time" className={inputCls} disabled={!day.enabled} value={day.open || ""} onChange={e => { const days = [...form.business_hours.days]; days[index] = { ...day, open: e.target.value }; setForm({ ...form, business_hours: { ...form.business_hours, configured: true, days } }); }} /></Field>
              <Field label="إلى"><input type="time" className={inputCls} disabled={!day.enabled} value={day.close || ""} onChange={e => { const days = [...form.business_hours.days]; days[index] = { ...day, close: e.target.value }; setForm({ ...form, business_hours: { ...form.business_hours, configured: true, days } }); }} /></Field>
            </div>)}
          </div>
        </Card>

        <div className="space-y-6">
          <Card icon={FileText} title="أقسام الصفحة الرئيسية">
            <Field label="محتوى قسم الجودة">
              <textarea className={`${inputCls} min-h-[100px]`} value={form.quality_content} onChange={(e) => setForm({ ...form, quality_content: e.target.value })} data-testid="admin-settings-quality" />
            </Field>
            <Field label="محتوى قسم المنهجية">
              <textarea className={`${inputCls} min-h-[100px]`} value={form.methodology_content} onChange={(e) => setForm({ ...form, methodology_content: e.target.value })} data-testid="admin-settings-methodology" />
            </Field>
          </Card>

          <Card icon={Building2} title="إدارة أقسام الصفحة الرئيسية">
            <p className="text-xs leading-6 text-slate-500">يمكن إظهار أو إخفاء الأقسام. ترتيبها الحالي هو ترتيب ظهورها من الأعلى إلى الأسفل.</p>
            {(form.homepage?.sections || HOMEPAGE_SECTIONS.map(x => x[0])).filter(key => HOMEPAGE_SECTIONS.some(section => section[0] === key)).map(key => {
              const label = HOMEPAGE_SECTIONS.find(section => section[0] === key)?.[1] || key;
              const sections = form.homepage?.sections || HOMEPAGE_SECTIONS.map(x => x[0]);
              const visible = form.homepage?.visible || {};
              const index = sections.indexOf(key);
              const checked = visible[key] !== false;
              const move = (direction) => { const next = [...sections]; const from = index < 0 ? next.length : index; if (from < 0 || from >= next.length) return; const to = from + direction; if (to < 0 || to >= next.length) return; [next[from], next[to]] = [next[to], next[from]]; setForm({ ...form, homepage: { ...(form.homepage || {}), sections: next } }); };
              return <div key={key} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm"><label className="flex min-w-0 items-center gap-2"><input type="checkbox" checked={checked} onChange={e => setForm({ ...form, homepage: { ...(form.homepage || {}), sections: sections.includes(key) ? sections : [...sections, key], visible: { ...visible, [key]: e.target.checked } } })} /><span>{label}</span></label><div className="flex gap-1"><button type="button" disabled={index <= 0} onClick={() => move(-1)} className="rounded border px-2 py-1 disabled:opacity-30" aria-label={`تحريك ${label} لأعلى`}>↑</button><button type="button" disabled={index < 0 || index >= sections.length - 1} onClick={() => move(1)} className="rounded border px-2 py-1 disabled:opacity-30" aria-label={`تحريك ${label} لأسفل`}>↓</button></div></div>;
            })}
          </Card>
          <Card icon={FileText} title="الخصوصية والشروط">
            <Field label="سياسة الخصوصية – العربية"><textarea className={`${inputCls} min-h-[110px]`} value={form.privacy_policy?.ar || ""} onChange={e => setForm({ ...form, privacy_policy: { ...(form.privacy_policy || {}), ar: e.target.value } })} /></Field>
            <Field label="Privacy Policy – English"><textarea dir="ltr" className={`${inputCls} min-h-[90px]`} value={form.privacy_policy?.en || ""} onChange={e => setForm({ ...form, privacy_policy: { ...(form.privacy_policy || {}), en: e.target.value } })} /></Field>
            <Field label="الشروط والأحكام – العربية"><textarea className={`${inputCls} min-h-[110px]`} value={form.terms?.ar || ""} onChange={e => setForm({ ...form, terms: { ...(form.terms || {}), ar: e.target.value } })} /></Field>
            <Field label="Terms – English"><textarea dir="ltr" className={`${inputCls} min-h-[90px]`} value={form.terms?.en || ""} onChange={e => setForm({ ...form, terms: { ...(form.terms || {}), en: e.target.value } })} /></Field>
          </Card>
          <Card icon={Search} title="SEO الافتراضي">
            <p className="text-xs leading-6 text-slate-500">تُستخدم هذه البيانات كإعدادات افتراضية، ويمكن تخصيص عنوان ووصف SEO لكل عنصر من محرر المحتوى.</p>
            <Field label="صورة المشاركة الافتراضية (Open Graph)"><input dir="ltr" className={inputCls} value={form.seo?.og_image_url || ""} onChange={e => setForm({ ...form, seo: { ...(form.seo || {}), og_image_url: e.target.value } })} placeholder="https://..." /></Field>
            <Field label="عنوان الموقع (Title)">
              <input className={inputCls} value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} data-testid="admin-settings-seo-title" />
            </Field>
            <Field label="وصف الموقع (Meta Description)">
              <textarea className={`${inputCls} min-h-[80px]`} value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} data-testid="admin-settings-seo-desc" />
            </Field>
          </Card>
          <CopyrightCard form={form} setForm={setForm} />
          <DefaultsCard onTextsReset={load} />
        </div>
        <EnglishTextsCard form={form} setForm={setForm} />
        <PageTextsCard form={form} setForm={setForm} />
      </div>
    </form>
  );
}
