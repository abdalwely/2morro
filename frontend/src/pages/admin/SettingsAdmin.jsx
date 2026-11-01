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
  en: {}, pages: {}, copyright_text: "", copyright_text_en: "",
};

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

  const load = (d) => setForm({ ...EMPTY, ...d, values: d.values || [], social: { ...EMPTY.social, ...(d.social || {}) } });

  useEffect(() => {
    if (data) load(data);
  }, [data]);

  const submit = async (e) => {
    e.preventDefault();
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
            <Field label="رقم واتساب" hint="بصيغة دولية بدون + مثال: 9665XXXXXXXX">
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

        <div className="space-y-6">
          <Card icon={FileText} title="أقسام الصفحة الرئيسية">
            <Field label="محتوى قسم الجودة">
              <textarea className={`${inputCls} min-h-[100px]`} value={form.quality_content} onChange={(e) => setForm({ ...form, quality_content: e.target.value })} data-testid="admin-settings-quality" />
            </Field>
            <Field label="محتوى قسم المنهجية">
              <textarea className={`${inputCls} min-h-[100px]`} value={form.methodology_content} onChange={(e) => setForm({ ...form, methodology_content: e.target.value })} data-testid="admin-settings-methodology" />
            </Field>
          </Card>

          <Card icon={Search} title="SEO الافتراضي">
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
