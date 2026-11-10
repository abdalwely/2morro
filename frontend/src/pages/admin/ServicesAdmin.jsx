import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Plus, Pencil, Trash2, Eye, ArrowUp, ArrowDown, Briefcase } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCrud } from "./crud";
import { Field, inputCls, ImageUploader, DynamicList, ConfirmDelete, EnglishFields } from "@/components/admin/AdminUI";
import { getIcon, ICON_NAMES } from "@/lib/icons";
import { LoadingBlock, EmptyState, SafeImage } from "@/components/site/Shared";

const EMPTY = {
  en: {},
  name: "", short_desc: "", detailed_desc: "", icon: "Globe", image_url: "",
  features: [], category: "", domain_id: "", technology_ids: [], order: 0, published: false, seo_title: "", seo_description: "",
};

export default function ServicesAdmin() {
  const { items, loading, save, remove, setOrder, togglePublish } = useCrud("services");
  const { data: domains = [] } = useQuery({ queryKey: ["admin-domains"], queryFn: () => api.get("/admin/domains").then(r => r.data) });
  const { data: technologies = [] } = useQuery({ queryKey: ["admin-technologies"], queryFn: () => api.get("/admin/technologies").then(r => r.data) });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleting, setDeleting] = useState(null);
  const [preview, setPreview] = useState(null);

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY, order: items.length + 1 });
    setDialogOpen(true);
  };
  const openEdit = (item) => {
    setEditing(item);
    setForm({
      en: item.en || {},
      name: item.name || "", short_desc: item.short_desc || "", detailed_desc: item.detailed_desc || "",
      icon: item.icon || "Globe", image_url: item.image_url || "", features: item.features || [],
      category: item.category || "", domain_id: item.domain_id || "", technology_ids: item.technology_ids || [], order: item.order || 0, published: Boolean(item.published),
      seo_title: item.seo_title || "", seo_description: item.seo_description || "",
    });
    setDialogOpen(true);
  };
  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.short_desc.trim()) return;
    const ok = await save(form, editing?.id);
    if (ok) setDialogOpen(false);
  };

  return (
    <div data-testid="admin-services-page">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900">إدارة الخدمات</h1>
          <p className="mt-1 text-sm text-slate-500">إضافة وتعديل وحذف خدمات الشركة وترتيبها ونشرها.</p>
        </div>
        <button onClick={openNew} className="btn-primary !px-4 !py-2.5 !text-xs" data-testid="admin-service-add-button">
          <Plus className="h-4 w-4" />
          إضافة خدمة جديدة
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
        {loading ? (
          <LoadingBlock />
        ) : items.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={Briefcase} title="لا توجد خدمات بعد" desc="ابدأ بإضافة أول خدمة للشركة." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="admin-services-table">
              <thead>
                <tr className="border-b border-slate-200 text-start text-xs text-slate-400">
                  <th className="p-3 sm:p-4 text-start font-bold">الخدمة</th>
                  <th className="hidden p-4 md:table-cell text-start font-bold">التصنيف</th>
                  <th className="hidden p-4 md:table-cell text-start font-bold">الترتيب</th>
                  <th className="p-3 sm:p-4 text-start font-bold">النشر</th>
                  <th className="p-3 sm:p-4 text-start font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const Icon = getIcon(item.icon);
                  return (
                    <tr key={item.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50" data-testid={`admin-service-row-${item.id}`}>
                      <td className="p-3 sm:p-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-electric-50 text-electric">
                            <Icon className="h-5 w-5" />
                          </span>
                          <div>
                            <div className="font-bold text-slate-800">{item.name}</div>
                            <div className="mt-0.5 max-w-md truncate text-xs text-slate-400">{item.short_desc}</div>
                          </div>
                        </div>
                      </td>
                      <td className="hidden p-4 md:table-cell text-slate-600">{item.category || "—"}</td>
                      <td className="hidden p-4 md:table-cell">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setOrder(item, "up")} className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition-colors hover:border-electric hover:text-electric disabled:opacity-30" disabled={item.order <= 1} aria-label="تحريك للأعلى" data-testid={`admin-service-move-up-${item.id}`}>
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <span className="mx-1 font-bold text-slate-600">{item.order}</span>
                          <button onClick={() => setOrder(item, "down")} className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition-colors hover:border-electric hover:text-electric" aria-label="تحريك للأسفل" data-testid={`admin-service-move-down-${item.id}`}>
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4">
                        <Switch checked={item.published} onCheckedChange={() => togglePublish(item)} data-testid={`admin-service-publish-${item.id}`} />
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="flex gap-1.5">
                          <button onClick={() => setPreview(item)} className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:border-electric hover:text-electric" aria-label="معاينة" data-testid={`admin-service-preview-${item.id}`}>
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => openEdit(item)} className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:border-electric hover:text-electric" aria-label="تعديل" data-testid={`admin-service-edit-${item.id}`}>
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeleting(item)} className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:border-red-300 hover:text-red-600" aria-label="حذف" data-testid={`admin-service-delete-${item.id}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl" className="max-h-[90vh] max-w-2xl overflow-y-auto" data-testid="admin-service-dialog">
          <DialogHeader>
            <DialogTitle className="text-right">{editing ? `تعديل الخدمة: ${editing.name}` : "إضافة خدمة جديدة"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4" data-testid="admin-service-form">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="اسم الخدمة *">
                <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} data-testid="admin-service-form-name" />
              </Field>
              <Field label="التصنيف">
                <input className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="مثال: تطوير الأنظمة" data-testid="admin-service-form-category" />
              </Field>
              <Field label="المجال التقني المرتبط">
                <select className={inputCls} value={form.domain_id} onChange={(e) => setForm({ ...form, domain_id: e.target.value })}>
                  <option value="">بدون مجال محدد</option>
                  {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </Field>
            </div>
            <Field label="الوصف المختصر *">
              <textarea className={`${inputCls} min-h-[70px]`} value={form.short_desc} onChange={(e) => setForm({ ...form, short_desc: e.target.value })} required data-testid="admin-service-form-short-desc" />
            </Field>
            <Field label="الوصف التفصيلي">
              <textarea className={`${inputCls} min-h-[130px]`} value={form.detailed_desc} onChange={(e) => setForm({ ...form, detailed_desc: e.target.value })} data-testid="admin-service-form-detailed-desc" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الأيقونة" hint="أيقونة تعبيرية من مكتبة الأيقونات">
                <Select dir="rtl" value={form.icon} onValueChange={(v) => setForm({ ...form, icon: v })}>
                  <SelectTrigger className="h-11" data-testid="admin-service-form-icon"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {ICON_NAMES.slice(0, 40).map((n) => {
                      const Ic = getIcon(n);
                      return (
                        <SelectItem key={n} value={n} data-testid={`icon-option-${n}`}>
                          <span className="flex items-center gap-2"><Ic className="h-4 w-4 text-electric" />{n}</span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="ترتيب الظهور">
                <input type="number" min="0" className={inputCls} value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} data-testid="admin-service-form-order" />
              </Field>
            </div>
            <EnglishFields form={form} setForm={setForm} testid="admin-service-form" fields={[{ key: "name", label: "Service name" }, { key: "category", label: "Category" }, { key: "short_desc", label: "Short description", type: "textarea" }, { key: "detailed_desc", label: "Detailed description", type: "textarea" }, { key: "features", label: "Features", type: "list" }, { key: "seo_title", label: "SEO title" }, { key: "seo_description", label: "SEO description", type: "textarea" }]} />
            <ImageUploader value={form.image_url} onChange={(u) => setForm({ ...form, image_url: u })} label="صورة الخدمة (اختياري)" testid="admin-service-form-image" />
            <Field label="المزايا والمخرجات">
              <DynamicList items={form.features} onChange={(f) => setForm({ ...form, features: f })} placeholder="مثال: تصميم متجاوب مع جميع الشاشات" testid="admin-service-form-features" />
            </Field>
            <Field label="التقنيات المرتبطة">
              <div className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-2">
                {technologies.length === 0 ? <span className="text-xs text-slate-500">أضف التقنيات أولاً من إدارة المنظومة التقنية.</span> : technologies.map(tech => <label key={tech.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.technology_ids.includes(tech.id)} onChange={e => setForm({ ...form, technology_ids: e.target.checked ? [...form.technology_ids, tech.id] : form.technology_ids.filter(id => id !== tech.id) })} />{tech.name}</label>)}
              </div>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="عنوان SEO">
                <input className={inputCls} value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} data-testid="admin-service-form-seo-title" />
              </Field>
              <Field label="وصف SEO">
                <input className={inputCls} value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} data-testid="admin-service-form-seo-desc" />
              </Field>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-sm font-bold text-slate-700">نشر الخدمة على الموقع</span>
              <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} data-testid="admin-service-form-published" />
            </div>
            <div className="flex justify-start gap-3 pt-2">
              <button type="submit" className="btn-primary !px-5 !py-2.5 !text-xs" data-testid="admin-service-form-submit">
                {editing ? "حفظ التعديلات" : "إضافة الخدمة"}
              </button>
              <button type="button" onClick={() => setDialogOpen(false)} className="rounded-lg border border-slate-300 px-5 py-2.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50" data-testid="admin-service-form-cancel">
                إلغاء
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(preview)} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent dir="rtl" className="max-h-[90vh] max-w-2xl overflow-y-auto" data-testid="admin-service-preview-dialog">
          <DialogHeader>
            <DialogTitle className="text-right">معاينة الخدمة</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-4">
              {preview.image_url && <SafeImage src={preview.image_url} alt={preview.name} className="aspect-video w-full rounded-xl object-cover" />}
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-electric-50 text-electric">{(() => { const I = getIcon(preview.icon); return <I className="h-5 w-5" />; })()}</span>
                <div>
                  <h3 className="font-heading font-bold text-slate-900">{preview.name}</h3>
                  <span className={`text-xs font-bold ${preview.published ? "text-emerald-600" : "text-amber-600"}`}>{preview.published ? "منشور" : "مسودة (غير منشور)"}</span>
                </div>
              </div>
              <p className="text-sm text-slate-600">{preview.short_desc}</p>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{preview.detailed_desc || "لا يوجد وصف تفصيلي."}</p>
              {preview.features?.length > 0 && (
                <ul className="space-y-1.5">
                  {preview.features.map((f, i) => (
                    <li key={f} className="text-sm text-slate-600">• {f}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        name={deleting?.name || ""}
        onConfirm={async () => {
          await remove(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
