import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Eye, ArrowUp, ArrowDown, Boxes, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api";
import { useCrud } from "./crud";
import { Field, inputCls, ImageUploader, GalleryManager, DynamicList, ConfirmDelete, EnglishFields } from "@/components/admin/AdminUI";
import { LoadingBlock, EmptyState, SafeImage } from "@/components/site/Shared";

const EMPTY = {
  en: {},
  name: "", short_desc: "", detailed_desc: "", main_image_url: "", gallery_urls: [],
  category: "", technologies: [], goals: "", outputs: "", external_url: "",
  service_id: "", order: 0, published: false,
};

export default function ProjectsAdmin() {
  const { items, loading, save, remove, setOrder, togglePublish } = useCrud("projects");
  const { data: services } = useQuery({ queryKey: ["admin-services"], queryFn: () => api.get("/admin/services").then((r) => r.data) });
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
      name: item.name || "", short_desc: item.short_desc || "", detailed_desc: item.detailed_desc || "",
      main_image_url: item.main_image_url || "", gallery_urls: item.gallery_urls || [],
      category: item.category || "", technologies: item.technologies || [], goals: item.goals || "",
      outputs: item.outputs || "", external_url: item.external_url || "", service_id: item.service_id || "",
      order: item.order || 0, published: Boolean(item.published),
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
    <div data-testid="admin-projects-page">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900">إدارة المشاريع</h1>
          <p className="mt-1 text-sm text-slate-500">إدارة معرض الأعمال: الصور والتفاصيل والتصنيفات والنشر.</p>
        </div>
        <button onClick={openNew} className="btn-primary !px-4 !py-2.5 !text-xs" data-testid="admin-project-add-button">
          <Plus className="h-4 w-4" />
          إضافة مشروع جديد
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
        {loading ? (
          <LoadingBlock />
        ) : items.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={Boxes} title="لا توجد مشاريع بعد" desc="ابدأ بإضافة أول مشروع إلى معرض الأعمال." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="admin-projects-table">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-400">
                  <th className="p-3 sm:p-4 text-start font-bold">المشروع</th>
                  <th className="hidden p-4 md:table-cell text-start font-bold">التصنيف</th>
                  <th className="hidden p-4 md:table-cell text-start font-bold">الترتيب</th>
                  <th className="p-3 sm:p-4 text-start font-bold">النشر</th>
                  <th className="p-3 sm:p-4 text-start font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50" data-testid={`admin-project-row-${item.id}`}>
                    <td className="p-3 sm:p-4">
                      <div className="flex items-center gap-3">
                        {item.main_image_url ? (
                          <img src={item.main_image_url.startsWith("http") ? item.main_image_url : `${process.env.REACT_APP_BACKEND_URL}${item.main_image_url}`} alt={item.name} className="h-12 w-16 shrink-0 rounded-lg object-cover" />
                        ) : (
                          <div className="h-12 w-16 shrink-0 rounded-lg bg-slate-100" />
                        )}
                        <div>
                          <div className="font-bold text-slate-800">{item.name}</div>
                          <div className="mt-0.5 max-w-md truncate text-xs text-slate-400">{item.short_desc}</div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden p-4 md:table-cell text-slate-600">{item.category || "—"}</td>
                    <td className="hidden p-4 md:table-cell">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setOrder(item, "up")} className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition-colors hover:border-electric hover:text-electric disabled:opacity-30" disabled={item.order <= 1} aria-label="تحريك للأعلى" data-testid={`admin-project-move-up-${item.id}`}>
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <span className="mx-1 font-bold text-slate-600">{item.order}</span>
                        <button onClick={() => setOrder(item, "down")} className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition-colors hover:border-electric hover:text-electric" aria-label="تحريك للأسفل" data-testid={`admin-project-move-down-${item.id}`}>
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="p-3 sm:p-4">
                      <Switch checked={item.published} onCheckedChange={() => togglePublish(item)} data-testid={`admin-project-publish-${item.id}`} />
                    </td>
                    <td className="p-3 sm:p-4">
                      <div className="flex gap-1.5">
                        <button onClick={() => setPreview(item)} className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:border-electric hover:text-electric" aria-label="معاينة" data-testid={`admin-project-preview-${item.id}`}>
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => openEdit(item)} className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:border-electric hover:text-electric" aria-label="تعديل" data-testid={`admin-project-edit-${item.id}`}>
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleting(item)} className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:border-red-300 hover:text-red-600" aria-label="حذف" data-testid={`admin-project-delete-${item.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl" className="max-h-[90vh] max-w-2xl overflow-y-auto" data-testid="admin-project-dialog">
          <DialogHeader>
            <DialogTitle className="text-right">{editing ? `تعديل المشروع: ${editing.name}` : "إضافة مشروع جديد"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4" data-testid="admin-project-form">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="اسم المشروع *">
                <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} data-testid="admin-project-form-name" />
              </Field>
              <Field label="التصنيف">
                <input className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="مثال: أنظمة مخصصة" data-testid="admin-project-form-category" />
              </Field>
            </div>
            <Field label="الوصف المختصر *">
              <textarea className={`${inputCls} min-h-[70px]`} value={form.short_desc} onChange={(e) => setForm({ ...form, short_desc: e.target.value })} required data-testid="admin-project-form-short-desc" />
            </Field>
            <Field label="الوصف التفصيلي">
              <textarea className={`${inputCls} min-h-[120px]`} value={form.detailed_desc} onChange={(e) => setForm({ ...form, detailed_desc: e.target.value })} data-testid="admin-project-form-detailed-desc" />
            </Field>
            <EnglishFields form={form} setForm={setForm} testid="admin-project-form" fields={[{ key: "name", label: "Project name" }, { key: "category", label: "Category" }, { key: "short_desc", label: "Short description", type: "textarea" }, { key: "detailed_desc", label: "Detailed description", type: "textarea" }, { key: "goals", label: "Goals", type: "textarea" }, { key: "outputs", label: "Outputs", type: "textarea" }]} />
            <ImageUploader value={form.main_image_url} onChange={(u) => setForm({ ...form, main_image_url: u })} label="الصورة الرئيسية" testid="admin-project-form-image" />
            <GalleryManager urls={form.gallery_urls} onChange={(g) => setForm({ ...form, gallery_urls: g })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الخدمة المرتبطة">
                <Select dir="rtl" value={form.service_id || "none"} onValueChange={(v) => setForm({ ...form, service_id: v === "none" ? "" : v })}>
                  <SelectTrigger className="h-11" data-testid="admin-project-form-service"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="none">بدون ربط</SelectItem>
                    {(services || []).map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="ترتيب الظهور">
                <input type="number" min="0" className={inputCls} value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} data-testid="admin-project-form-order" />
              </Field>
            </div>
            <Field label="التقنيات المستخدمة">
              <DynamicList items={form.technologies} onChange={(t) => setForm({ ...form, technologies: t })} placeholder="مثال: React" testid="admin-project-form-tech" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="أهداف المشروع">
                <textarea className={`${inputCls} min-h-[80px]`} value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} data-testid="admin-project-form-goals" />
              </Field>
              <Field label="مخرجات المشروع">
                <textarea className={`${inputCls} min-h-[80px]`} value={form.outputs} onChange={(e) => setForm({ ...form, outputs: e.target.value })} data-testid="admin-project-form-outputs" />
              </Field>
            </div>
            <Field label="رابط خارجي (اختياري)">
              <input dir="ltr" className={inputCls} value={form.external_url} onChange={(e) => setForm({ ...form, external_url: e.target.value })} placeholder="https://…" data-testid="admin-project-form-external" />
            </Field>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-sm font-bold text-slate-700">نشر المشروع على الموقع</span>
              <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} data-testid="admin-project-form-published" />
            </div>
            <div className="flex justify-start gap-3 pt-2">
              <button type="submit" className="btn-primary !px-5 !py-2.5 !text-xs" data-testid="admin-project-form-submit">
                {editing ? "حفظ التعديلات" : "إضافة المشروع"}
              </button>
              <button type="button" onClick={() => setDialogOpen(false)} className="rounded-lg border border-slate-300 px-5 py-2.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50" data-testid="admin-project-form-cancel">
                إلغاء
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(preview)} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent dir="rtl" className="max-h-[90vh] max-w-2xl overflow-y-auto" data-testid="admin-project-preview-dialog">
          <DialogHeader>
            <DialogTitle className="text-right">معاينة المشروع</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-4">
              {preview.main_image_url && <SafeImage src={preview.main_image_url} alt={preview.name} className="aspect-video w-full rounded-xl object-cover" />}
              <div>
                <h3 className="font-heading font-bold text-slate-900">{preview.name}</h3>
                <span className={`text-xs font-bold ${preview.published ? "text-emerald-600" : "text-amber-600"}`}>{preview.published ? "منشور" : "مسودة (غير منشور)"}</span>
              </div>
              <p className="text-sm text-slate-600">{preview.short_desc}</p>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{preview.detailed_desc || "لا يوجد وصف تفصيلي."}</p>
              {preview.technologies?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {preview.technologies.map((t, i) => (
                    <span key={t} className="chip border-electric/20 bg-electric-50 text-electric">{t}</span>
                  ))}
                </div>
              )}
              {preview.external_url && (
                <a href={preview.external_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-electric">
                  <ExternalLink className="h-4 w-4" />
                  الرابط الخارجي
                </a>
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
