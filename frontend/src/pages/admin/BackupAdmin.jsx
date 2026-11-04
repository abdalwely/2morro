import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  CalendarDays,
  X,
  Download,
  Upload,
  DatabaseBackup,
  History,
  Archive,
  RefreshCw,
  Trash2,
  RotateCcw,
  HardDrive,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  inputCls,
  ConfirmAction,
  PageTitle,
  Card,
} from "@/components/admin/AdminUI";

const PARTS = [
  {
    key: "content",
    label: "المحتوى",
    desc: "الخدمات والمشاريع ونماذج التنفيذ وسجل الصور",
  },
  {
    key: "users",
    label: "حسابات المستخدمين",
    desc: "تشمل كلمات المرور المشفّرة — احفظ الملف في مكان آمن",
  },
  {
    key: "settings",
    label: "الإعدادات",
    desc: "بيانات الشركة والنصوص والألوان والمظهر",
  },
  {
    key: "activity",
    label: "سجل النشاط",
    desc: "العمليات التي تمت في لوحة التحكم",
  },
];

const ZIP_WARNING =
  "تحذير مهم: استعادة هذه النسخة عملية استبدال كاملة لبيانات قاعدة MongoDB وملفات حاوية التخزين. قد تُحذف بيانات أو ملفات أُضيفت بعد تاريخ إنشاء النسخة إذا لم تكن موجودة داخلها. سيُحافظ النظام على حساب المدير الحالي وفق آلية الحماية. يُنصح بإنشاء نسخة احتياطية حديثة قبل المتابعة. هذه العملية ليست دمجًا.";

function formatBytes(value) {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes < 0) return "غير متاح";
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} كيلوبايت`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(2)} ميجابايت`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} جيجابايت`;
}

function formatDate(value) {
  if (!value) return "غير متاح";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "غير متاح"
    : format(date, "d MMMM yyyy - HH:mm", { locale: ar });
}

function PartsPicker({ value, onChange, testid }) {
  const toggle = (key) =>
    onChange(
      value.includes(key)
        ? value.filter((item) => item !== key)
        : [...value, key],
    );

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {PARTS.map((part) => (
        <label
          key={part.key}
          className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 hover:border-electric/40"
        >
          <Checkbox
            checked={value.includes(part.key)}
            onCheckedChange={() => toggle(part.key)}
            data-testid={`${testid}-${part.key}`}
            className="mt-0.5"
          />
          <span>
            <span className="block text-sm font-bold text-slate-800">
              {part.label}
            </span>
            <span className="block text-xs text-slate-500">{part.desc}</span>
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
            <button
              type="button"
              className={`${inputCls} flex items-center justify-between text-start`}
              data-testid={testid}
            >
              <span className={value ? "text-slate-900" : "text-slate-400"}>
                {date
                  ? format(date, "d MMMM yyyy", { locale: ar })
                  : "اختر التاريخ"}
              </span>
              <CalendarDays className="h-4 w-4 text-slate-400" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              locale={ar}
              dir="rtl"
              formatters={{
                formatWeekdayName: (day) =>
                  format(day, "EEEEEE", { locale: ar }),
              }}
              onSelect={(day) => {
                onChange(day ? format(day, "yyyy-MM-dd") : "");
                setOpen(false);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded-lg border border-slate-300 px-3 text-slate-500 hover:text-red-600"
            aria-label="مسح التاريخ"
            data-testid={`${testid}-clear`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </Field>
  );
}

function ExportCard() {
  const [parts, setParts] = useState(PARTS.map((part) => part.key));
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);

  const download = async () => {
    if (!parts.length) return toast.error("اختر نوع البيانات المطلوب نسخها");
    if (from && to && from > to)
      return toast.error(
        "تاريخ البداية يجب أن يكون قبل تاريخ النهاية أو مساويًا له",
      );

    setBusy(true);
    try {
      const response = await api.get("/admin/backup", {
        params: {
          parts: parts.join(","),
          date_from: from || undefined,
          date_to: to || undefined,
        },
        responseType: "blob",
      });
      const filename =
        (response.headers["content-disposition"] || "").match(
          /filename="?([^";]+)"?/,
        )?.[1] || "2morro-backup.json";
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("تم تنزيل نسخة JSON الاحتياطية بنجاح");
    } catch (error) {
      toast.error(
        error?.response?.status === 400
          ? "تحقق من الاختيارات والتواريخ"
          : formatApiError(error),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      icon={Download}
      title="نسخة JSON جزئية"
      testid="admin-backup-export-card"
    >
      <p className="mb-3 text-sm text-slate-500">
        انسخ أجزاء محددة من قاعدة البيانات، مع إمكانية تحديد فترة زمنية.
      </p>
      <PartsPicker
        value={parts}
        onChange={setParts}
        testid="admin-backup-part"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <DateField
          label="من تاريخ (اختياري)"
          hint="يُطبّق على تاريخ إنشاء السجلات"
          value={from}
          onChange={setFrom}
          testid="admin-backup-from"
        />
        <DateField
          label="إلى تاريخ (اختياري)"
          value={to}
          onChange={setTo}
          testid="admin-backup-to"
        />
      </div>
      <button
        type="button"
        onClick={download}
        disabled={busy}
        className="btn-primary disabled:opacity-60"
        data-testid="admin-backup-download-button"
      >
        <DatabaseBackup className="h-4 w-4" />
        {busy ? "جارٍ تجهيز النسخة…" : "تنزيل نسخة JSON"}
      </button>
    </Card>
  );
}

function RestoreJsonCard() {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState("merge");
  const [parts, setParts] = useState(PARTS.map((part) => part.key));
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();

  const restore = async () => {
    if (!file || !parts.length) return;
    setConfirm(false);
    setBusy(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", mode);
    formData.append("parts", parts.join(","));

    try {
      const { data } = await api.post("/admin/backup/restore", formData);
      const total = Object.values(data.restored || {}).reduce(
        (sum, count) => sum + Number(count || 0),
        0,
      );
      toast.success(`تمت استعادة JSON بنجاح (${total} سجل)`);
      await queryClient.invalidateQueries();
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      icon={History}
      title="استعادة نسخة JSON"
      testid="admin-backup-restore-card"
    >
      <p className="mb-3 text-sm text-slate-500">
        استعد أجزاء محددة من ملف JSON باستخدام الدمج أو الاستبدال.
      </p>
      <PartsPicker
        value={parts}
        onChange={setParts}
        testid="admin-restore-part"
      />
      <div className="grid gap-2 sm:grid-cols-2">
        {[
          ["merge", "دمج", "تحديث السجلات الموجودة وإضافة الناقصة دون حذف شيء"],
          [
            "replace",
            "استبدال كامل",
            "حذف البيانات الحالية للأجزاء المختارة واستبدالها بالنسخة",
          ],
        ].map(([key, label, description]) => (
          <button
            type="button"
            key={key}
            onClick={() => setMode(key)}
            className={`rounded-xl border p-3 text-start transition-colors ${
              mode === key
                ? "border-electric bg-electric-50"
                : "border-slate-200 hover:border-electric/40"
            }`}
            data-testid={`admin-restore-mode-${key}`}
          >
            <span className="block text-sm font-bold text-slate-800">
              {label}
            </span>
            <span className="block text-xs text-slate-500">{description}</span>
          </button>
        ))}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(event) => {
          setFile(event.target.files?.[0] || null);
        }}
        data-testid="admin-restore-file-input"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="btn-outline !py-2.5 !text-xs"
          data-testid="admin-restore-pick-button"
        >
          <Upload className="h-4 w-4" />
          اختيار ملف JSON
        </button>
        <span
          className="text-xs text-slate-500"
          data-testid="admin-restore-file-name"
        >
          {file ? file.name : "لم يتم اختيار ملف"}
        </span>
      </div>
      <button
        type="button"
        onClick={() => setConfirm(true)}
        disabled={!file || !parts.length || busy}
        className="btn-primary disabled:opacity-50"
        data-testid="admin-restore-button"
      >
        {busy ? "جارٍ الاستعادة…" : "استعادة بيانات JSON"}
      </button>
      <p className="text-xs text-slate-500">
        النسخ المأخوذة لفترة زمنية محددة تُستعاد بطريقة الدمج فقط.
      </p>
      <ConfirmAction
        open={confirm}
        onOpenChange={setConfirm}
        title="تأكيد استعادة JSON"
        confirmLabel="نعم، استعد البيانات"
        onConfirm={restore}
        testid="admin-restore"
        description={
          mode === "replace"
            ? "سيتم حذف البيانات الحالية للأجزاء المختارة واستبدالها بمحتوى الملف. حساب المدير الحالي لن يُحذف. يُنصح بتنزيل نسخة احتياطية أولًا."
            : "سيتم تحديث السجلات الموجودة وإضافة الناقصة من الملف دون حذف بيانات أخرى."
        }
      />
    </Card>
  );
}

function FullZipBackupCard() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [downloading, setDownloading] = useState("");
  const [restoring, setRestoring] = useState("");
  const [deleting, setDeleting] = useState("");
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const queryClient = useQueryClient();

  const loadBackups = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get("/admin/backup/zip", {
        params: { limit: 100, offset: 0 },
      });
      setBackups(Array.isArray(data.backups) ? data.backups : []);
    } catch (error) {
      if (!silent) toast.error(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
    // Load once when the backup page is mounted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createBackup = async () => {
    setCreating(true);
    try {
      const { data } = await api.post("/admin/backup/zip");
      toast.success(
        `تم إنشاء النسخة الكاملة بنجاح — ${formatBytes(data.archive_size)}`,
      );
      await loadBackups({ silent: true });
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setCreating(false);
    }
  };

  const downloadBackup = async (backup) => {
    setDownloading(backup.filename);
    try {
      const response = await api.get(
        `/admin/backup/zip/${encodeURIComponent(backup.filename)}`,
        { responseType: "blob" },
      );
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = backup.filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("بدأ تنزيل النسخة الاحتياطية");
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setDownloading("");
    }
  };

  const restoreBackup = async () => {
    if (!restoreTarget) return;
    const target = restoreTarget;
    setRestoreTarget(null);
    setRestoring(target.filename);
    try {
      const { data } = await api.post(
        `/admin/backup/zip/${encodeURIComponent(target.filename)}/restore`,
      );
      const collectionCount = Object.keys(
        data.restored_collections || {},
      ).length;
      const fileCount = Number(data.restored_files?.file_count || 0);
      toast.success(
        `اكتملت الاستعادة: ${collectionCount} مجموعة و${fileCount} ملف. سيتم تحديث بيانات لوحة الإدارة.`,
      );
      await queryClient.invalidateQueries();
      await loadBackups({ silent: true });
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setRestoring("");
    }
  };

  const deleteBackup = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setDeleting(target.filename);
    try {
      await api.delete(
        `/admin/backup/zip/${encodeURIComponent(target.filename)}`,
      );
      toast.success("تم حذف ملف النسخة الاحتياطية");
      await loadBackups({ silent: true });
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setDeleting("");
    }
  };

  return (
    <Card
      icon={Archive}
      title="النسخ الكاملة ZIP"
      testid="admin-full-zip-backup-card"
    >
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        <div className="mb-1 flex items-center gap-2 font-bold">
          <HardDrive className="h-4 w-4" />
          نسخة كاملة لقاعدة البيانات والملفات
        </div>
        تشمل النسخة مجموعات MongoDB وملفات حاوية Supabase Storage. استعادة ZIP
        استبدال كامل وليست دمجًا، وقد تحذف الملفات والبيانات التي أُضيفت بعد
        تاريخ النسخة.
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={createBackup}
          disabled={creating || loading || Boolean(restoring)}
          className="btn-primary disabled:opacity-60"
          data-testid="admin-zip-create-button"
        >
          <DatabaseBackup className="h-4 w-4" />
          {creating ? "جارٍ إنشاء النسخة الكاملة…" : "إنشاء نسخة كاملة الآن"}
        </button>
        <button
          type="button"
          onClick={() => loadBackups()}
          disabled={loading || creating || Boolean(restoring)}
          className="btn-outline !py-2.5"
          data-testid="admin-zip-refresh-button"
          aria-label="تحديث قائمة النسخ"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          تحديث القائمة
        </button>
      </div>

      <div className="space-y-3" data-testid="admin-zip-backup-list">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-800">
            النسخ المحفوظة في Supabase
          </h3>
          <span className="text-xs text-slate-500">{backups.length} نسخة</span>
        </div>

        {loading ? (
          <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
            جارٍ تحميل قائمة النسخ…
          </p>
        ) : backups.length === 0 ? (
          <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
            لا توجد نسخ ZIP محفوظة حتى الآن.
          </p>
        ) : (
          backups.map((backup) => {
            const rowBusy =
              creating ||
              Boolean(restoring) ||
              Boolean(deleting) ||
              Boolean(downloading);
            return (
              <div
                key={backup.filename}
                className="rounded-xl border border-slate-200 p-3"
                data-testid={`admin-zip-backup-${backup.filename}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-all text-sm font-semibold text-slate-800">
                      {backup.filename}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>{formatDate(backup.created_at)}</span>
                      <span>{formatBytes(backup.size)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => downloadBackup(backup)}
                      disabled={rowBusy}
                      className="btn-outline !px-3 !py-2 !text-xs disabled:opacity-50"
                      data-testid="admin-zip-download-button"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {downloading === backup.filename
                        ? "جارٍ التنزيل…"
                        : "تنزيل"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRestoreTarget(backup)}
                      disabled={rowBusy}
                      className="btn-outline !px-3 !py-2 !text-xs disabled:opacity-50"
                      data-testid="admin-zip-restore-button"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      {restoring === backup.filename
                        ? "جارٍ الاستعادة…"
                        : "استعادة"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(backup)}
                      disabled={rowBusy}
                      className="btn-outline !px-3 !py-2 !text-xs text-red-600 disabled:opacity-50"
                      data-testid="admin-zip-delete-button"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {deleting === backup.filename ? "جارٍ الحذف…" : "حذف"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmAction
        open={Boolean(restoreTarget)}
        onOpenChange={(open) => {
          if (!open) setRestoreTarget(null);
        }}
        title="تأكيد الاستعادة الكاملة"
        confirmLabel="أؤكد استبدال البيانات والملفات"
        onConfirm={restoreBackup}
        testid="admin-zip-restore-confirm"
        description={
          restoreTarget
            ? `${ZIP_WARNING}\n\nالنسخة المحددة: ${restoreTarget.filename}`
            : ZIP_WARNING
        }
      />
      <ConfirmAction
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="تأكيد حذف النسخة"
        confirmLabel="نعم، احذف النسخة"
        onConfirm={deleteBackup}
        testid="admin-zip-delete-confirm"
        description={
          deleteTarget
            ? `سيتم حذف ملف النسخة من Supabase نهائيًا، ولن يؤثر ذلك على بيانات الموقع الحالية.\n\n${deleteTarget.filename}`
            : "سيتم حذف ملف النسخة من Supabase نهائيًا."
        }
      />
    </Card>
  );
}

export default function BackupAdmin() {
  return (
    <div data-testid="admin-backup-page">
      <PageTitle
        title="النسخ الاحتياطي والاستعادة"
        desc="إدارة النسخ الجزئية بصيغة JSON والنسخ الكاملة بصيغة ZIP لقاعدة البيانات والملفات."
      />
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ExportCard />
        <RestoreJsonCard />
      </div>
      <div className="mt-6">
        <FullZipBackupCard />
      </div>
    </div>
  );
}
