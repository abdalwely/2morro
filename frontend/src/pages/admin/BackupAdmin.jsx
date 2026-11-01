import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarDays, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Download, Upload, DatabaseBackup, History } from "lucide-react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, inputCls, ConfirmAction, PageTitle, Card } from "@/components/admin/AdminUI";

const PARTS = [
  { key: "content", label: "المحتوى", desc: "الخدمات والمشاريع ونماذج التنفيذ وسجل الصور" },
  { key: "users", label: "حسابات المستخدمين", desc: "تشمل كلمات المرور المشفّرة — احفظ الملف في مكان آمن" },
  { key: "settings", label: "الإعدادات", desc: "بيانات الشركة والنصوص والألوان والمظهر" },
  { key: "activity", label: "سجل النشاط", desc: "العمليات التي تمت في لوحة التحكم" },
];

function PartsPicker({ value, onChange, testid }) {
  const toggle = (k) => onChange(value.includes(k) ? value.filter((x) => x !== k) : [...value, k]);
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {PARTS.map((p) => (
        <label key={p.key} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 hover:border-electric/40">
          <Checkbox checked={value.includes(p.key)} onCheckedChange={() => toggle(p.key)} data-testid={`${testid}-${p.key}`} className="mt-0.5" />
          <span>
            <span className="block text-sm font-bold text-slate-800">{p.label}</span>
            <span className="block text-xs text-slate-500">{p.desc}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

function DateField({ label, value, onChange, testid, hint }) {
  const [open, setOpen] = useState(false);
  const date = value ? new Date(`${value}T00:00:00`) : undefined;
  return (
    <Field label={label} hint={hint}>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button type="button" className={`${inputCls} flex items-center justify-between text-start`} data-testid={testid}>
              <span className={value ? "text-slate-900" : "text-slate-400"}>{date ? format(date, "d MMMM yyyy", { locale: ar }) : "اختر التاريخ"}</span>
              <CalendarDays className="h-4 w-4 text-slate-400" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={date} locale={ar} dir="rtl" formatters={{ formatWeekdayName: (d) => format(d, "EEEEEE", { locale: ar }) }} onSelect={(d) => { onChange(d ? format(d, "yyyy-MM-dd") : ""); setOpen(false); }} initialFocus />
          </PopoverContent>
        </Popover>
        {value && (
          <button type="button" onClick={() => onChange("")} className="rounded-lg border border-slate-300 px-3 text-slate-500 hover:text-red-600" aria-label="مسح التاريخ" data-testid={`${testid}-clear`}>
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </Field>
  );
}

function ExportCard() {
  const [parts, setParts] = useState(PARTS.map((p) => p.key));
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);

  const download = async () => {
    if (!parts.length) return toast.error("اختر نوع البيانات المطلوب نسخها");
    if (from && to && from > to) return toast.error("تاريخ البداية يجب أن يكون قبل تاريخ النهاية أو مساويًا له");
    setBusy(true);
    try {
      const res = await api.get("/admin/backup", { params: { parts: parts.join(","), date_from: from, date_to: to }, responseType: "blob" });
      const name = (res.headers["content-disposition"] || "").match(/filename="(.+)"/)?.[1] || "2morro-backup.json";
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("تم تنزيل النسخة الاحتياطية بنجاح");
    } catch (err) {
      toast.error(err?.response?.status === 400 ? "تحقق من الاختيارات والتواريخ" : formatApiError(err));
    }
    setBusy(false);
  };

  return (
    <Card icon={Download} title="إنشاء نسخة احتياطية" testid="admin-backup-export-card">
      <PartsPicker value={parts} onChange={setParts} testid="admin-backup-part" />
      <div className="grid gap-4 sm:grid-cols-2">
        <DateField label="من تاريخ (اختياري)" hint="يُطبّق على تاريخ إنشاء السجلات" value={from} onChange={setFrom} testid="admin-backup-from" />
        <DateField label="إلى تاريخ (اختياري)" value={to} onChange={setTo} testid="admin-backup-to" />
      </div>
      <button onClick={download} disabled={busy} className="btn-primary disabled:opacity-60" data-testid="admin-backup-download-button">
        <DatabaseBackup className="h-4 w-4" />
        {busy ? "جارٍ التجهيز…" : "تنزيل النسخة الاحتياطية"}
      </button>
    </Card>
  );
}

function RestoreCard() {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState("merge");
  const [parts, setParts] = useState(PARTS.map((p) => p.key));
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();

  const restore = async () => {
    setConfirm(false);
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("mode", mode);
    fd.append("parts", parts.join(","));
    try {
      const { data } = await api.post("/admin/backup/restore", fd);
      const total = Object.values(data.restored).reduce((a, b) => a + b, 0);
      toast.success(`تمت الاستعادة بنجاح (${total} سجل)`);
      await qc.invalidateQueries();
      setFile(null);
    } catch (err) {
      toast.error(formatApiError(err));
    }
    setBusy(false);
  };

  return (
    <Card icon={History} title="استعادة من نسخة احتياطية" testid="admin-backup-restore-card">
      <PartsPicker value={parts} onChange={setParts} testid="admin-restore-part" />
      <div className="grid gap-2 sm:grid-cols-2">
        {[["merge", "دمج", "تحديث السجلات الموجودة وإضافة الناقصة دون حذف شيء"], ["replace", "استبدال كامل", "حذف البيانات الحالية للأجزاء المختارة واستبدالها بالنسخة"]].map(([k, l, d]) => (
          <button type="button" key={k} onClick={() => setMode(k)} className={`rounded-xl border p-3 text-start transition-colors ${mode === k ? "border-electric bg-electric-50" : "border-slate-200 hover:border-electric/40"}`} data-testid={`admin-restore-mode-${k}`}>
            <span className="block text-sm font-bold text-slate-800">{l}</span>
            <span className="block text-xs text-slate-500">{d}</span>
          </button>
        ))}
      </div>
      <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { setFile(e.target.files?.[0] || null); e.target.value = ""; }} data-testid="admin-restore-file-input" />
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => fileRef.current?.click()} className="btn-outline !py-2.5 !text-xs" data-testid="admin-restore-pick-button">
          <Upload className="h-4 w-4" />
          اختيار ملف النسخة
        </button>
        <span className="text-xs text-slate-500" data-testid="admin-restore-file-name">{file ? file.name : "لم يتم اختيار ملف"}</span>
      </div>
      <button onClick={() => setConfirm(true)} disabled={!file || !parts.length || busy} className="btn-primary disabled:opacity-50" data-testid="admin-restore-button">
        {busy ? "جارٍ الاستعادة…" : "استعادة البيانات"}
      </button>
      <p className="text-xs text-slate-500">النسخ المأخوذة لفترة زمنية محددة تُستعاد بطريقة الدمج فقط.</p>
      <ConfirmAction open={confirm} onOpenChange={setConfirm} title="تأكيد الاستعادة" confirmLabel="نعم، استعد البيانات" onConfirm={restore} testid="admin-restore"
        description={mode === "replace" ? "سيتم حذف البيانات الحالية للأجزاء المختارة واستبدالها بمحتوى الملف. حسابك الحالي لن يُحذف. يُنصح بتنزيل نسخة احتياطية أولًا." : "سيتم تحديث السجلات الموجودة وإضافة الناقصة من الملف دون حذف أي بيانات."} />
    </Card>
  );
}

export default function BackupAdmin() {
  return (
    <div data-testid="admin-backup-page">
      <PageTitle title="النسخ الاحتياطي" desc="نسخ قاعدة البيانات كاملة أو أجزاء منها حسب النوع والتاريخ، واستعادتها عند الحاجة." />
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ExportCard />
        <RestoreCard />
      </div>
    </div>
  );
}
