import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, RefreshCw, X, Save, Languages, Image as ImageIcon, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { useCrud } from "./crud";
import { ImageUploader } from "@/components/admin/AdminUI";
import { Switch } from "@/components/ui/switch";
import { LoadingBlock, EmptyState } from "@/components/site/Shared";

const CONFIG = {
  domains: { title: "إدارة المجالات التقنية", desc: "المجالات التقنية التي تصنف خدمات الشركة.", fields: ["name", "short_desc", "detailed_desc", "icon", "seo_title", "seo_description", "order", "published"], image: "image_url" },
  solutions: { title: "إدارة الحلول المتكاملة", desc: "حلول تجمع الخدمات والتقنيات والقطاعات.", fields: ["name", "short_desc", "detailed_desc", "features", "components", "seo_title", "seo_description", "order", "published"], image: "image_url", relations: ["service_ids", "sector_ids", "technology_ids"] },
  sectors: { title: "إدارة القطاعات", desc: "القطاعات التي تخدمها الشركة.", fields: ["name", "short_desc", "detailed_desc", "icon", "seo_title", "seo_description", "order", "published"], image: "image_url" },
  project_categories: { title: "تصنيفات المشاريع", desc: "التصنيف الأساسي لكل مشروع.", fields: ["name", "description", "seo_title", "seo_description", "order", "published"], image: "image_url" },
  technologies: { title: "إدارة التقنيات", desc: "التقنيات والمنصات والشهادات والاعتمادات. لا تنشر شراكة رسمية دون إثبات.", fields: ["name", "description", "category", "relationship_type", "verification_url", "website_url", "seo_title", "seo_description", "order", "published"], image: "logo_url" },
  methodology_phases: { title: "مراحل منهجية العمل", desc: "مراحل رحلة تنفيذ العمل، مستقلة عن نماذج التنفيذ.", fields: ["name", "short_desc", "detailed_desc", "activities", "outputs", "icon", "seo_title", "seo_description", "order", "published"], image: "image_url" },
  articles: { title: "مركز المعرفة", desc: "المقالات والأدلة والموارد المنشورة.", fields: ["title", "summary", "content", "type", "author", "published_at", "seo_title", "seo_description", "order", "published"], image: "cover_image_url", relations: ["category_id"] },
  article_categories: { title: "تصنيفات المعرفة", desc: "تصنيفات المقالات والموارد.", fields: ["name", "description", "seo_title", "seo_description", "order", "published"] },
};

const LABELS = {
  name: "الاسم", title: "عنوان المحتوى", slug: "الرابط المختصر (Slug)", short_desc: "الوصف المختصر", detailed_desc: "الوصف التفصيلي", description: "الوصف", summary: "الملخص", content: "المحتوى الكامل", icon: "اسم الأيقونة", category: "التصنيف النصي", relationship_type: "نوع العنصر", verification_url: "رابط إثبات الاعتماد أو الشراكة", website_url: "الموقع الرسمي", features: "المزايا (كل عنصر في سطر)", components: "مكونات الحل (كل عنصر في سطر)", activities: "الأنشطة (كل عنصر في سطر)", outputs: "المخرجات (كل عنصر في سطر)", author: "الكاتب", published_at: "تاريخ النشر", type: "نوع المحتوى", seo_title: "عنوان SEO", seo_description: "وصف SEO", order: "ترتيب العرض", published: "نشر المحتوى" ,
};
const LONG = new Set(["detailed_desc", "description", "summary", "content", "short_desc", "seo_description"]);
const ARRAYS = new Set(["features", "components", "activities", "outputs"]);
const EN_FIELDS = ["name", "title", "short_desc", "detailed_desc", "description", "summary", "content", "features", "components", "activities", "outputs", "category", "seo_title", "seo_description"];
const empty = {
  domains: { name: "", short_desc: "", detailed_desc: "", icon: "", image_url: "", order: 0, published: false, en: {} },
  solutions: { name: "", short_desc: "", detailed_desc: "", service_ids: [], sector_ids: [], technology_ids: [], features: [], components: [], image_url: "", gallery_urls: [], order: 0, published: false, en: {} },
  sectors: { name: "", short_desc: "", detailed_desc: "", icon: "", image_url: "", order: 0, published: false, en: {} },
  project_categories: { name: "", description: "", image_url: "", order: 0, published: false, en: {} },
  technologies: { name: "", description: "", category: "", relationship_type: "technology", verification_url: "", logo_url: "", website_url: "", order: 0, published: false, en: {} },
  methodology_phases: { name: "", short_desc: "", detailed_desc: "", activities: [], outputs: [], icon: "", image_url: "", order: 0, published: false, en: {} },
  articles: { title: "", slug: "", summary: "", content: "", type: "article", category_id: "", cover_image_url: "", attachment_url: "", author: "", published_at: "", order: 0, published: false, seo_title: "", seo_description: "", en: {} },
  article_categories: { name: "", description: "", order: 0, published: false, en: {} },
};

function Field({ label, children, hint }) {
  return <label className="block min-w-0"><span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>{children}{hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}</label>;
}
const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const textAreaClass = `${inputClass} min-h-[104px] resize-y leading-7`;

export default function ContentAdmin({ entity }) {
  const config = CONFIG[entity];
  const { items, loading, refresh, remove, setOrder, togglePublish } = useCrud(entity);
  const { data: services = [] } = useQuery({ queryKey: ["admin-services-relations"], queryFn: () => api.get("/admin/services").then(r => r.data), enabled: entity === "solutions" });
  const { data: sectors = [] } = useQuery({ queryKey: ["admin-sectors-relations"], queryFn: () => api.get("/admin/sectors").then(r => r.data), enabled: entity === "solutions" });
  const { data: technologies = [] } = useQuery({ queryKey: ["admin-technologies-relations"], queryFn: () => api.get("/admin/technologies").then(r => r.data), enabled: entity === "solutions" });
  const { data: articleCategories = [] } = useQuery({ queryKey: ["admin-article-categories-relations"], queryFn: () => api.get("/admin/article_categories").then(r => r.data), enabled: entity === "articles" });
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);
  const relations = { service_ids: services, sector_ids: sectors, technology_ids: technologies };

  const setField = (field, value) => setForm(old => ({ ...old, [field]: value }));
  const setEnglish = (field, value) => setForm(old => ({ ...old, en: { ...(old.en || {}), [field]: value } }));
  const openNew = () => { setEditing(null); setForm(structuredClone(empty[entity])); setShowEnglish(false); setShowEditor(true); };
  const openEdit = item => { setEditing(item); const { id, created_at, updated_at, ...payload } = item; setForm({ ...structuredClone(empty[entity]), ...payload, en: payload.en || {} }); setShowEnglish(false); setShowEditor(true); };
  const toggleRelation = (field, id, checked) => {
    const values = Array.isArray(form[field]) ? form[field] : [];
    setField(field, checked ? [...values, id] : values.filter(value => value !== id));
  };
  const save = async () => {
    if (!form) return;
    const name = form.name || form.title || "";
    const short = form.short_desc || form.summary || form.description || "";
    if (name.trim().length < 2) { toast.error("أدخل اسمًا أو عنوانًا لا يقل عن حرفين."); return; }
    if (["domains", "solutions", "sectors", "articles"].includes(entity) && short.trim().length < 2) { toast.error("أدخل وصفًا مختصرًا للمحتوى."); return; }
    setSaving(true);
    try {
      if (editing) await api.put(`/admin/${entity}/${editing.id}`, form);
      else await api.post(`/admin/${entity}`, form);
      toast.success("تم حفظ المحتوى بنجاح"); setShowEditor(false); await refresh();
    } catch (error) { toast.error(formatApiError(error)); }
    finally { setSaving(false); }
  };
  const deleteItem = async item => {
    if (!window.confirm(`هل تريد حذف «${item.name || item.title || "هذا العنصر"}»؟`)) return;
    try { await remove(item.id); } catch (error) { toast.error(formatApiError(error)); }
  };
  const fieldValue = (field) => ARRAYS.has(field) ? (form[field] || []).join("\n") : (form[field] ?? "");
  const updateField = (field, value) => setField(field, ARRAYS.has(field) ? value.split("\n").map(x => x.trim()).filter(Boolean) : (field === "order" ? (value === "" ? 0 : Number(value)) : value));

  if (!config) return <EmptyState title="نوع المحتوى غير معروف" />;
  return <div dir="rtl" className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-extrabold text-slate-900">{config.title}</h1><p className="mt-1 text-sm text-slate-500">{config.desc}</p></div>
      <div className="flex gap-2"><button onClick={refresh} className="rounded-xl border px-3 py-2 text-sm"><RefreshCw className="inline h-4 w-4" /> تحديث</button><button onClick={openNew} className="btn-primary !px-4 !py-2"><Plus className="inline h-4 w-4" /> إضافة عنصر</button></div>
    </div>
    {loading ? <LoadingBlock /> : items.length === 0 ? <div className="rounded-2xl border bg-white p-8"><EmptyState title="لا توجد عناصر بعد" desc="أضف أول عنصر، ثم راجعه وانشره ليظهر في الموقع." /></div> :
      <div className="overflow-hidden rounded-2xl border bg-white"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-4 text-right">العنصر</th><th className="p-4 text-right">المعرّف</th>{entity === "domains" && <th className="p-4 text-right">الترتيب</th>}<th className="p-4 text-right">النشر</th><th className="p-4 text-right">الإجراءات</th></tr></thead><tbody>{items.map(item => <tr key={item.id} className="border-t"><td className="p-4"><div className="font-bold">{item.name || item.title || "بدون اسم"}</div><div className="mt-1 max-w-xl truncate text-xs text-slate-500">{item.short_desc || item.summary || item.description || "—"}</div></td><td className="p-4 text-xs text-slate-500" dir="ltr">{item.slug || item.id}</td>{entity === "domains" && <td className="p-4"><div className="flex items-center gap-1"><button onClick={() => setOrder(item, "up")} className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition-colors hover:border-blue-500 hover:text-blue-600 disabled:opacity-30" disabled={items.findIndex(x => x.id === item.id) === 0} aria-label="تحريك للأعلى" title="تحريك للأعلى" data-testid={`admin-domain-move-up-${item.id}`}><ArrowUp className="h-3.5 w-3.5" /></button><span className="mx-1 min-w-5 text-center font-bold text-slate-600">{item.order ?? 0}</span><button onClick={() => setOrder(item, "down")} className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition-colors hover:border-blue-500 hover:text-blue-600 disabled:opacity-30" disabled={items.findIndex(x => x.id === item.id) === items.length - 1} aria-label="تحريك للأسفل" title="تحريك للأسفل" data-testid={`admin-domain-move-down-${item.id}`}><ArrowDown className="h-3.5 w-3.5" /></button></div></td>}<td className="p-4">{entity === "domains" ? <div className="flex items-center gap-2"><Switch checked={Boolean(item.published)} onCheckedChange={() => togglePublish(item)} aria-label={item.published ? "إخفاء المنشور" : "إظهار المنشور"} data-testid={`admin-domain-publish-${item.id}`} /><span className={`rounded-full px-2 py-1 text-xs ${item.published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{item.published ? "منشور" : "مسودة"}</span></div> : <span className={`rounded-full px-2 py-1 text-xs ${item.published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{item.published ? "منشور" : "مسودة"}</span>}</td><td className="p-4"><div className="flex gap-2"><button onClick={() => openEdit(item)} className="rounded-lg border p-2 text-blue-700" aria-label="تعديل"><Pencil className="h-4 w-4" /></button><button onClick={() => deleteItem(item)} className="rounded-lg border p-2 text-red-600" aria-label="حذف"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody></table></div></div>}
    {showEditor && form && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3"><div className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b p-4"><div><div className="font-bold">{editing ? "تعديل المحتوى" : "إضافة محتوى جديد"}</div><p className="mt-1 text-xs text-slate-500">نموذج مرئي — لا تحتاج إلى كتابة JSON أو معرفة أسماء الحقول.</p></div><button onClick={() => setShowEditor(false)} className="rounded-lg p-2 hover:bg-slate-100" aria-label="إغلاق"><X className="h-5 w-5" /></button></div>
      <div className="overflow-y-auto p-4 sm:p-6"><div className="grid gap-4 md:grid-cols-2">
        {config.fields.map(field => <div key={field} className={LONG.has(field) || ARRAYS.has(field) ? "md:col-span-2" : ""}>
          {field === "published" ? <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"><input type="checkbox" checked={Boolean(form.published)} onChange={e => setField(field, e.target.checked)} className="h-4 w-4" /><span className="text-sm font-semibold text-slate-800">نشر المحتوى على الموقع</span></label> :
            field === "relationship_type" ? <Field label={LABELS[field]}><select className={inputClass} value={form[field] || "technology"} onChange={e => setField(field, e.target.value)}><option value="technology">تقنية</option><option value="platform">منصة</option><option value="certification">شهادة</option><option value="accreditation">اعتماد</option><option value="official_partner">شريك رسمي (يتطلب رابط إثبات)</option></select></Field> :
            ARRAYS.has(field) || LONG.has(field) ? <Field label={LABELS[field] || field}><textarea className={textAreaClass} value={fieldValue(field)} onChange={e => updateField(field, e.target.value)} placeholder={ARRAYS.has(field) ? "اكتب كل عنصر في سطر مستقل" : "اكتب النص هنا..."} /></Field> :
            <Field label={LABELS[field] || field}><input className={inputClass} type={field === "order" ? "number" : field === "published_at" ? "date" : "text"} min={field === "order" ? 0 : undefined} value={fieldValue(field)} onChange={e => updateField(field, e.target.value)} /></Field>}
        </div>)}
      </div>
      {config.image && <div className="mt-5 rounded-xl border border-slate-200 p-4"><div className="mb-3 flex items-center gap-2 text-sm font-bold"><ImageIcon className="h-4 w-4 text-blue-600" /> الصورة الرئيسية</div><ImageUploader value={form[config.image] || ""} onChange={url => setField(config.image, url)} label={entity === "technologies" ? "صورة توضيحية للمنظومة (ليست شعار شريك)" : entity === "articles" ? "صورة غلاف المقال" : "الصورة الرئيسية"} testid={`admin-${entity}-image`} /></div>}
      {config.relations?.filter(field => field !== "category_id").map(field => <div key={field} className="mt-5 rounded-xl border border-slate-200 p-4"><h3 className="mb-3 text-sm font-bold">{{ service_ids: "الخدمات المكونة للحل", sector_ids: "القطاعات المستهدفة", technology_ids: "التقنيات المستخدمة" }[field]}</h3><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{(relations[field] || []).map(option => <label key={option.id} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 text-sm"><input type="checkbox" checked={(form[field] || []).includes(option.id)} onChange={e => toggleRelation(field, option.id, e.target.checked)} />{option.name}</label>)}</div>{!(relations[field] || []).length && <p className="text-xs text-slate-500">لا توجد عناصر متاحة للربط بعد.</p>}</div>)}
      {entity === "articles" && <div className="mt-5"><Field label="تصنيف المقال"><select className={inputClass} value={form.category_id || ""} onChange={e => setField("category_id", e.target.value)}><option value="">بدون تصنيف</option>{articleCategories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field></div>}
      <div className="mt-5 overflow-hidden rounded-xl border border-slate-200"><button type="button" onClick={() => setShowEnglish(v => !v)} className="flex w-full items-center justify-between bg-slate-50 px-4 py-3 text-sm font-bold"><span className="flex items-center gap-2"><Languages className="h-4 w-4 text-blue-600" /> الترجمة الإنجليزية لهذا المحتوى</span><span>{showEnglish ? "إخفاء" : "تحرير الترجمة"}</span></button>{showEnglish && <div className="grid gap-4 p-4 md:grid-cols-2" dir="ltr">{EN_FIELDS.filter(field => Object.prototype.hasOwnProperty.call(form, field) || config.fields.includes(field)).map(field => <Field key={field} label={`${LABELS[field] || field} — English`}>{ARRAYS.has(field) || LONG.has(field) ? <textarea className={textAreaClass} dir="ltr" value={Array.isArray(form.en?.[field]) ? form.en[field].join("\n") : form.en?.[field] || ""} onChange={e => setEnglish(field, ARRAYS.has(field) ? e.target.value.split("\n").map(x => x.trim()).filter(Boolean) : e.target.value)} /> : <input className={inputClass} dir="ltr" value={form.en?.[field] || ""} onChange={e => setEnglish(field, e.target.value)} />}</Field>)}</div>}</div>
      <p className="mt-4 text-xs leading-6 text-slate-500">ملاحظة: اترك العنصر كمسودة حتى تكتمل مراجعته واعتماد معلوماته وصوره وروابطه. لا تنشر شريكًا أو اعتمادًا دون إثبات موثوق.</p>
      </div>
      <div className="flex justify-end gap-2 border-t bg-slate-50 p-4"><button onClick={() => setShowEditor(false)} className="rounded-xl border bg-white px-4 py-2.5 text-sm">إلغاء</button><button onClick={save} disabled={saving} className="btn-primary !px-5 !py-2.5 disabled:opacity-60"><Save className="inline h-4 w-4" /> {saving ? "جارٍ الحفظ…" : "حفظ المحتوى"}</button></div>
    </div></div>}
  </div>;
}
