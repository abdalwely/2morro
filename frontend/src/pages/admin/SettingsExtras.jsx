import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Languages, LayoutTemplate, Copyright, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { Field, inputCls, DynamicList, ConfirmAction, Card } from "@/components/admin/AdminUI";

const EN_TEXTS = [
  ["tagline", "Tagline"], ["hero_title", "Home title"], ["hero_subtitle", "Home description", true], ["about_short", "About summary"],
  ["about_content", "About page content", true], ["mission", "Mission", true], ["vision", "Vision", true], ["quality_content", "Quality section", true],
  ["methodology_content", "Methodology section", true], ["footer_text", "Footer text", true], ["seo_title", "SEO title"], ["seo_description", "SEO description", true],
];
const PAGES = [["about", "من نحن"], ["services", "الخدمات"], ["projects", "المشاريع"], ["models", "نماذج التنفيذ"], ["contact", "تواصل معنا"]];

export function EnglishTextsCard({ form, setForm }) {
  const en = form.en || {};
  const set = (k, v) => setForm({ ...form, en: { ...en, [k]: v } });
  return (
    <Card icon={Languages} title="نصوص النسخة الإنجليزية" testid="admin-settings-en-card">
      <p className="text-xs text-slate-500">تظهر هذه النصوص عند تحويل الموقع إلى English. الحقل الفارغ يعرض النص العربي.</p>
      <div className="space-y-3" dir="ltr">
        {EN_TEXTS.map(([k, label, long]) => (
          <Field key={k} label={label}>
            {long
              ? <textarea className={`${inputCls} min-h-[80px]`} value={en[k] || ""} onChange={(e) => set(k, e.target.value)} data-testid={`admin-settings-en-${k}`} />
              : <input className={inputCls} value={en[k] || ""} onChange={(e) => set(k, e.target.value)} data-testid={`admin-settings-en-${k}`} />}
          </Field>
        ))}
        <Field label="Values">
          <DynamicList items={en.values || []} onChange={(v) => set("values", v)} placeholder="English value" testid="admin-settings-en-values" />
        </Field>
      </div>
    </Card>
  );
}

export function PageTextsCard({ form, setForm }) {
  const pages = form.pages || {};
  const set = (page, k, v) => setForm({ ...form, pages: { ...pages, [page]: { ...(pages[page] || {}), [k]: v } } });
  return (
    <Card icon={LayoutTemplate} title="عناوين رؤوس الصفحات" testid="admin-settings-pages-card">
      {PAGES.map(([key, label]) => (
        <div key={key} className="rounded-xl border border-slate-200 p-4" data-testid={`admin-settings-page-${key}`}>
          <div className="mb-3 text-sm font-extrabold text-slate-800">صفحة {label}</div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[["badge", "الشارة"], ["title", "العنوان"], ["subtitle", "الوصف"]].map(([f, l]) => (
              <div key={f} className="contents">
                <Field label={l}>
                  <input className={inputCls} value={pages[key]?.[f] || ""} onChange={(e) => set(key, f, e.target.value)} data-testid={`admin-settings-page-${key}-${f}`} />
                </Field>
                <Field label={`${l} (English)`}>
                  <input dir="ltr" className={inputCls} value={pages[key]?.[`${f}_en`] || ""} onChange={(e) => set(key, `${f}_en`, e.target.value)} data-testid={`admin-settings-page-${key}-${f}-en`} />
                </Field>
              </div>
            ))}
          </div>
        </div>
      ))}
    </Card>
  );
}

export function CopyrightCard({ form, setForm }) {
  return (
    <Card icon={Copyright} title="حقوق الملكية" testid="admin-settings-copyright-card">
      <p className="text-xs text-slate-500">اتركه فارغًا لعرض النص التلقائي: © السنة الحالية + اسم الشركة — جميع الحقوق محفوظة.</p>
      <Field label="نص حقوق الملكية (عربي)">
        <input className={inputCls} value={form.copyright_text || ""} onChange={(e) => setForm({ ...form, copyright_text: e.target.value })} data-testid="admin-settings-copyright" />
      </Field>
      <Field label="Copyright text (English)">
        <input dir="ltr" className={inputCls} value={form.copyright_text_en || ""} onChange={(e) => setForm({ ...form, copyright_text_en: e.target.value })} data-testid="admin-settings-copyright-en" />
      </Field>
    </Card>
  );
}

export function DefaultsCard({ onTextsReset }) {
  const { user } = useAdminAuth();
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState(null);
  if (user?.role !== "admin") return null;

  const run = async () => {
    const kind = confirm;
    setConfirm(null);
    try {
      const { data } = await api.post(`/admin/defaults/${kind}`);
      if (kind === "texts") onTextsReset(data);
      await qc.invalidateQueries();
      toast.success(kind === "texts" ? "تمت استعادة النصوص الافتراضية" : `تمت استعادة المحتوى الافتراضي (${data.restored} عنصر)`);
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  return (
    <Card icon={RotateCcw} title="المحتوى الافتراضي" testid="admin-settings-defaults-card">
      <p className="text-xs text-slate-500">إعادة النصوص أو المحتوى إلى الحالة الافتراضية عند تشغيل الموقع لأول مرة.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setConfirm("texts")} className="btn-outline !px-4 !py-2.5 !text-xs" data-testid="admin-defaults-texts-button">استعادة النصوص الافتراضية</button>
        <button type="button" onClick={() => setConfirm("demo-content")} className="btn-outline !px-4 !py-2.5 !text-xs" data-testid="admin-defaults-content-button">استعادة المحتوى الافتراضي</button>
      </div>
      <ConfirmAction open={Boolean(confirm)} onOpenChange={(o) => !o && setConfirm(null)} onConfirm={run} testid="admin-defaults"
        title={confirm === "texts" ? "استعادة النصوص الافتراضية" : "استعادة المحتوى الافتراضي"} confirmLabel="نعم، استعد الافتراضي"
        description={confirm === "texts"
          ? "ستعود نصوص الصفحات (العربية والإنجليزية) وعناوين الصفحات وحقوق الملكية إلى الافتراضي. بيانات التواصل والشعار والألوان لن تتغير."
          : "ستعود الخدمات والمشاريع ونماذج التنفيذ الافتراضية (التجريبية) إلى حالتها الأصلية، وتُضاف المحذوفة منها. العناصر التي أضفتها أنت لن تتأثر."} />
    </Card>
  );
}
