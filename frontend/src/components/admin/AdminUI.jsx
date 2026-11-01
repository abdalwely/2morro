import { useRef, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { X, Trash2, Upload, ImageIcon, Plus } from "lucide-react";
import api, { formatApiError, imgSrc } from "@/lib/api";
import { toast } from "sonner";

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-electric focus:outline-none focus:ring-2 focus:ring-electric/30";

export function ImageUploader({ value, onChange, label = "الصورة", testid = "image-uploader" }) {
  const fileRef = useRef(null);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      toast.error("صيغة الملف غير مدعومة، الصيغ المدعومة: JPG وPNG وWEBP وGIF");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يتجاوز الحد الأقصى (5 ميجابايت)");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data } = await api.post("/admin/upload", fd);
      onChange(data.url);
      toast.success("تم رفع الصورة بنجاح");
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  return (
    <div>
      <span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative h-20 w-32 overflow-hidden rounded-lg border border-slate-200">
            <img src={imgSrc(value)} alt="معاينة الصورة" className="h-full w-full object-cover" data-testid={`${testid}-preview`} />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-1 end-1 rounded-md bg-navy-900/80 p-1 text-white transition-colors hover:bg-red-600"
              aria-label="إزالة الصورة"
              data-testid={`${testid}-remove`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex h-20 w-32 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
            <ImageIcon className="h-7 w-7 text-slate-300" />
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={pick} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="btn-outline !px-4 !py-2 !text-xs"
          data-testid={`${testid}-upload-button`}
        >
          <Upload className="h-4 w-4" />
          {value ? "استبدال الصورة" : "رفع صورة"}
        </button>
      </div>
    </div>
  );
}

export function GalleryManager({ urls = [], onChange }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const pick = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    let current = [...urls];
    for (const file of files) {
      if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
        toast.error(`الصيغة غير مدعومة: ${file.name}`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`حجم الملف يتجاوز 5 ميجابايت: ${file.name}`);
        continue;
      }
      const fd = new FormData();
      fd.append("file", file);
      setUploading(true);
      try {
        const { data } = await api.post("/admin/upload", fd);
        current = [...current, data.url];
        onChange(current);
      } catch (err) {
        toast.error(formatApiError(err));
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div>
      <span className="mb-1.5 block text-sm font-bold text-slate-700">صور المعرض</span>
      <div className="flex flex-wrap gap-3">
        {urls.map((u, i) => (
          <div key={`${u}-${i}`} className="relative h-20 w-32 overflow-hidden rounded-lg border border-slate-200" data-testid={`gallery-item-${i}`}>
            <img src={imgSrc(u)} alt={`صورة المعرض ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(urls.filter((_, idx) => idx !== i))}
              className="absolute top-1 end-1 rounded-md bg-navy-900/80 p-1 text-white transition-colors hover:bg-red-600"
              aria-label="حذف الصورة"
              data-testid={`gallery-remove-${i}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden onChange={pick} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex h-20 w-32 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs font-bold text-slate-500 transition-colors hover:border-electric hover:text-electric disabled:opacity-50"
          data-testid="gallery-add-button"
        >
          <Upload className="h-5 w-5" />
          {uploading ? "جارٍ الرفع…" : "إضافة صور"}
        </button>
      </div>
    </div>
  );
}

export function DynamicList({ items = [], onChange, placeholder = "أضف عنصرًا…", testid = "dynamic-list" }) {
  const update = (i, v) => onChange(items.map((x, idx) => (idx === i ? v : x)));
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            type="text"
            value={item}
            onChange={(e) => update(i, e.target.value)}
            placeholder={placeholder}
            className={inputCls}
            data-testid={`${testid}-input-${i}`}
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            className="rounded-lg border border-slate-300 px-3 text-slate-500 transition-colors hover:border-red-300 hover:text-red-600"
            aria-label="حذف العنصر"
            data-testid={`${testid}-remove-${i}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-bold text-slate-500 transition-colors hover:border-electric hover:text-electric"
        data-testid={`${testid}-add`}
      >
        <Plus className="h-4 w-4" />
        إضافة عنصر
      </button>
    </div>
  );
}

export function ConfirmDelete({ open, onOpenChange, name, onConfirm }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-right">تأكيد الحذف</AlertDialogTitle>
          <AlertDialogDescription className="text-right">
            هل أنت متأكد من حذف «{name}»؟ لا يمكن التراجع عن هذا الإجراء.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row justify-start gap-2">
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 text-white hover:bg-red-700"
            data-testid="confirm-delete-button"
          >
            نعم، احذف
          </AlertDialogAction>
          <AlertDialogCancel data-testid="cancel-delete-button">إلغاء</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function EnglishFields({ form, setForm, fields, testid }) {
  const [open, setOpen] = useState(false);
  const en = form.en || {};
  const set = (key, value) => setForm({ ...form, en: { ...en, [key]: value } });
  const setPhase = (i, key, value) => {
    const phases = (form.phases || []).map((_, idx) => ({ title: "", desc: "", ...(en.phases || [])[idx] }));
    phases[i] = { ...phases[i], [key]: value };
    set("phases", phases);
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4" data-testid={`${testid}-en`}>
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-sm font-bold text-slate-700" data-testid={`${testid}-en-toggle`}>
        <span>النسخة الإنجليزية (English) — اختياري</span>
        <span className="text-xs text-electric">{open ? "إخفاء" : "إظهار"}</span>
      </button>
      {open && (
        <div className="mt-4 space-y-3" dir="ltr">
          <p className="text-xs text-slate-500" dir="rtl">إذا تُرك الحقل فارغًا يظهر النص العربي في النسخة الإنجليزية.</p>
          {fields.map((f) => (
            <Field key={f.key} label={f.label}>
              {f.type === "textarea" && <textarea className={`${inputCls} min-h-[90px]`} value={en[f.key] || ""} onChange={(e) => set(f.key, e.target.value)} data-testid={`${testid}-en-${f.key}`} />}
              {f.type === "list" && <DynamicList items={en[f.key] || []} onChange={(v) => set(f.key, v)} placeholder="English item" testid={`${testid}-en-${f.key}`} />}
              {f.type === "phases" && (form.phases || []).map((ph, i) => (
                <div key={`${ph.title}-${i}`} className="mb-2 grid gap-2 sm:grid-cols-2">
                  <input className={inputCls} placeholder={ph.title || `Phase ${i + 1}`} value={(en.phases || [])[i]?.title || ""} onChange={(e) => setPhase(i, "title", e.target.value)} data-testid={`${testid}-en-phase-title-${i}`} />
                  <input className={inputCls} placeholder="Description" value={(en.phases || [])[i]?.desc || ""} onChange={(e) => setPhase(i, "desc", e.target.value)} data-testid={`${testid}-en-phase-desc-${i}`} />
                </div>
              ))}
              {!f.type && <input className={inputCls} value={en[f.key] || ""} onChange={(e) => set(f.key, e.target.value)} data-testid={`${testid}-en-${f.key}`} />}
            </Field>
          ))}
        </div>
      )}
    </div>
  );
}

export function ConfirmAction({ open, onOpenChange, title, description, confirmLabel, onConfirm, danger = true, testid = "confirm-action" }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir="rtl" data-testid={`${testid}-dialog`}>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-right">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-right">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row justify-start gap-2">
          <AlertDialogAction onClick={onConfirm} className={danger ? "bg-red-600 text-white hover:bg-red-700" : "bg-electric text-white hover:bg-electric-600"} data-testid={`${testid}-confirm`}>
            {confirmLabel}
          </AlertDialogAction>
          <AlertDialogCancel data-testid={`${testid}-cancel`}>إلغاء</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function PageTitle({ title, desc, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-slate-900">{title}</h1>
        {desc && <p className="mt-1 text-sm text-slate-500">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

export function Card({ icon: Icon, title, children, testid }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6" data-testid={testid}>
      <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-slate-900">
        {Icon && <Icon className="h-5 w-5 text-electric" />}
        {title}
      </h2>
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}
