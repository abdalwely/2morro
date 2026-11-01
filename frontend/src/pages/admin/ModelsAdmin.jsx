import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, ArrowUp, ArrowDown, Route } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useCrud } from "./crud";
import { Field, inputCls, ImageUploader, DynamicList, ConfirmDelete, EnglishFields } from "@/components/admin/AdminUI";
import { LoadingBlock, EmptyState } from "@/components/site/Shared";

const EMPTY = {
  en: {},
  name: "", short_desc: "", detailed_desc: "", phases: [], outputs: [],
  image_url: "", duration: "", order: 0, published: false,
};

export default function ModelsAdmin() {
  const { items, loading, save, remove, setOrder, togglePublish } = useCrud("delivery_models");
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
      phases: (item.phases || []).map((p) => ({ title: p.title || "", desc: p.desc || "" })),
      outputs: item.outputs || [], image_url: item.image_url || "", duration: item.duration || "",
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
  const setPhase = (i, key, val) => {
    setForm({ ...form, phases: form.phases.map((p, idx) => (idx === i ? { ...p, [key]: val } : p)) });
  };

  return (
    <div data-testid="admin-models-page">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900">إدارة نماذج التنفيذ</h1>
          <p className="mt-1 text-sm text-slate-500">إدارة نماذج منهجية العمل ومراحل التنفيذ والمخرجات.</p>
        </div>
        <button onClick={openNew} className="btn-primary !px-4 !py-2.5 !text-xs" data-testid="admin-model-add-button">
          <Plus className="h-4 w-4" />
          إضافة نموذج جديد
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
        {loading ? (
          <LoadingBlock />
        ) : items.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={Route} title="لا توجد نماذج بعد" desc="ابدأ بإضافة أول نموذج تنفيذ." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="admin-models-table">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-400">
                  <th className="p-3 sm:p-4 text-start font-bold">النموذج</th>
                  <th className="hidden p-4 md:table-cell text-start font-bold">المراحل</th>
                  <th className="hidden p-4 md:table-cell text-start font-bold">الترتيب</th>
                  <th className="p-3 sm:p-4 text-start font-bold">النشر</th>
                  <th className="p-3 sm:p-4 text-start font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50" data-testid={`admin-model-row-${item.id}`}>
                    <td className="p-3 sm:p-4">
                      <div className="font-bold text-slate-800">{item.name}</div>
                      <div className="mt-0.5 max-w-md truncate text-xs text-slate-400">{item.short_desc}</div>
                    </td>
                    <td className="hidden p-4 md:table-cell text-slate-600">{item.phases?.length || 0}</td>
                    <td className="hidden p-4 md:table-cell">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setOrder(item, "up")} className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition-colors hover:border-electric hover:text-electric disabled:opacity-30" disabled={item.order <= 1} aria-label="تحريك للأعلى" data-testid={`admin-model-move-up-${item.id}`}>
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <span className="mx-1 font-bold text-slate-600">{item.order}</span>
                        <button onClick={() => setOrder(item, "down")} className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition-colors hover:border-electric hover:text-electric" aria-label="تحريك للأسفل" data-testid={`admin-model-move-down-${item.id}`}>
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="p-3 sm:p-4">
                      <Switch checked={item.published} onCheckedChange={() => togglePublish(item)} data-testid={`admin-model-publish-${item.id}`} />
                    </td>
                    <td className="p-3 sm:p-4">
                      <div className="flex gap-1.5">
                        <button onClick={() => setPreview(item)} className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:border-electric hover:text-electric" aria-label="معاينة" data-testid={`admin-model-preview-${item.id}`}>
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => openEdit(item)} className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:border-electric hover:text-electric" aria-label="تعديل" data-testid={`admin-model-edit-${item.id}`}>
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleting(item)} className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:border-red-300 hover:text-red-600" aria-label="حذف" data-testid={`admin-model-delete-${item.id}`}>
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
        <DialogContent dir="rtl" className="max-h-[90vh] max-w-2xl overflow-y-auto" data-testid="admin-model-dialog">
          <DialogHeader>
            <DialogTitle className="text-right">{editing ? `تعديل النموذج: ${editing.name}` : "إضافة نموذج تنفيذ"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4" data-testid="admin-model-form">
            <Field label="اسم النموذج *">
              <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} data-testid="admin-model-form-name" />
            </Field>
            <Field label="الوصف المختصر *">
              <textarea className={`${inputCls} min-h-[70px]`} value={form.short_desc} onChange={(e) => setForm({ ...form, short_desc: e.target.value })} required data-testid="admin-model-form-short-desc" />
            </Field>
            <Field label="الشرح التفصيلي">
              <textarea className={`${inputCls} min-h-[110px]`} value={form.detailed_desc} onChange={(e) => setForm({ ...form, detailed_desc: e.target.value })} data-testid="admin-model-form-detailed-desc" />
            </Field>

            <div>
              <span className="mb-1.5 block text-sm font-bold text-slate-700">مراحل التنفيذ</span>
              <div className="space-y-3">
                {form.phases.map((ph, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-4" data-testid={`admin-model-phase-editor-${i}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">المرحلة {i + 1}</span>
                      <button type="button" onClick={() => setForm({ ...form, phases: form.phases.filter((_, idx) => idx !== i) })} className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition-colors hover:border-red-300 hover:text-red-600" aria-label="حذف المرحلة" data-testid={`admin-model-phase-remove-${i}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <input className={inputCls} value={ph.title} onChange={(e) => setPhase(i, "title", e.target.value)} placeholder="عنوان المرحلة" data-testid={`admin-model-phase-title-${i}`} />
                    <textarea className={`${inputCls} mt-2 min-h-[60px]`} value={ph.desc} onChange={(e) => setPhase(i, "desc", e.target.value)} placeholder="وصف المرحلة" data-testid={`admin-model-phase-desc-${i}`} />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setForm({ ...form, phases: [...form.phases, { title: "", desc: "" }] })}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-bold text-slate-500 transition-colors hover:border-electric hover:text-electric"
                  data-testid="admin-model-phase-add"
                >
                  <Plus className="h-4 w-4" />
                  إضافة مرحلة
                </button>
              </div>
            </div>

            <Field label="المخرجات المتوقعة">
              <DynamicList items={form.outputs} onChange={(o) => setForm({ ...form, outputs: o })} placeholder="مثال: وثيقة متطلبات معتمدة" testid="admin-model-form-outputs" />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="مدة التنفيذ">
                <input className={inputCls} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="مثال: أسبوع إلى أسبوعين" data-testid="admin-model-form-duration" />
              </Field>
              <Field label="ترتيب العرض">
                <input type="number" min="0" className={inputCls} value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} data-testid="admin-model-form-order" />
              </Field>
            </div>
            <EnglishFields form={form} setForm={setForm} testid="admin-model-form" fields={[{ key: "name", label: "Model name" }, { key: "short_desc", label: "Short description", type: "textarea" }, { key: "detailed_desc", label: "Detailed description", type: "textarea" }, { key: "phases", label: "Phases", type: "phases" }, { key: "outputs", label: "Outputs", type: "list" }, { key: "duration", label: "Duration" }]} />
            <ImageUploader value={form.image_url} onChange={(u) => setForm({ ...form, image_url: u })} label="صورة أو مخطط توضيحي (اختياري)" testid="admin-model-form-image" />

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-sm font-bold text-slate-700">نشر النموذج على الموقع</span>
              <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} data-testid="admin-model-form-published" />
            </div>
            <div className="flex justify-start gap-3 pt-2">
              <button type="submit" className="btn-primary !px-5 !py-2.5 !text-xs" data-testid="admin-model-form-submit">
                {editing ? "حفظ التعديلات" : "إضافة النموذج"}
              </button>
              <button type="button" onClick={() => setDialogOpen(false)} className="rounded-lg border border-slate-300 px-5 py-2.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50" data-testid="admin-model-form-cancel">
                إلغاء
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(preview)} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent dir="rtl" className="max-h-[90vh] max-w-2xl overflow-y-auto" data-testid="admin-model-preview-dialog">
          <DialogHeader>
            <DialogTitle className="text-right">معاينة النموذج</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-4">
              <div>
                <h3 className="font-heading font-bold text-slate-900">{preview.name}</h3>
                <span className={`text-xs font-bold ${preview.published ? "text-emerald-600" : "text-amber-600"}`}>{preview.published ? "منشور" : "مسودة (غير منشور)"}</span>
              </div>
              <p className="text-sm text-slate-600">{preview.short_desc}</p>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{preview.detailed_desc || "لا يوجد شرح تفصيلي."}</p>
              {preview.phases?.length > 0 && (
                <ol className="space-y-2 border-s-2 border-dashed border-electric/30 ps-4">
                  {preview.phases.map((ph, i) => (
                    <li key={`${ph.title}-${i}`}>
                      <span className="text-sm font-bold text-slate-800">{i + 1}. {ph.title}</span>
                      {ph.desc && <p className="text-xs text-slate-500">{ph.desc}</p>}
                    </li>
                  ))}
                </ol>
              )}
              {preview.outputs?.length > 0 && (
                <ul className="space-y-1">
                  {preview.outputs.map((o, i) => (
                    <li key={`${o}-${i}`} className="text-sm text-slate-600">• {o}</li>
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
