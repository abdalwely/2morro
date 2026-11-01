import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Boxes, Route, FileX2, ArrowLeft, History, Users, Images, DatabaseBackup } from "lucide-react";
import api from "@/lib/api";
import { fmtDate } from "@/lib/api";

const ACTION_LABELS = { create: "إضافة", update: "تعديل", delete: "حذف", export: "تنزيل", restore: "استعادة", reset: "إعادة افتراضي" };
const ENTITY_LABELS = { services: "خدمة", projects: "مشروع", delivery_models: "نموذج تنفيذ", settings: "بيانات الشركة", users: "مستخدم", backup: "نسخة احتياطية", theme: "المظهر", content: "المحتوى" };

function StatCard({ icon: Icon, label, published, total, color, testid, note }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg" data-testid={testid}>
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className={`font-heading font-black text-slate-900 ${typeof published === "string" ? "text-xl" : "text-3xl"}`}>{published}</span>
        {!note && <span className="text-sm font-bold text-slate-400">/ {total}</span>}
      </div>
      <div className="mt-1 text-sm font-bold text-slate-600">{label}</div>
      <div className="mt-1 text-xs text-slate-400">{note || `منشور من إجمالي ${total}`}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api.get("/admin/stats").then((r) => r.data),
    refetchInterval: 30 * 1000,
  });

  const drafts =
    (stats?.services.drafts || 0) + (stats?.projects.drafts || 0) + (stats?.delivery_models.drafts || 0);

  return (
    <div data-testid="admin-dashboard">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900" data-testid="admin-dashboard-title">مرحبًا بك في لوحة التحكم</h1>
          <p className="mt-1 text-sm text-slate-500">ملخص عام للمحتوى المنشور على الموقع وحالة العناصر.</p>
        </div>
        <Link to="/" target="_blank" className="btn-outline !px-4 !py-2 !text-xs" data-testid="admin-dashboard-preview-site">
          معاينة الموقع
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>

      {isLoading || !stats ? (
        <div className="flex items-center justify-center py-24" data-testid="admin-dashboard-loading">
          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-electric border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Briefcase} label="الخدمات" published={stats.services.published} total={stats.services.total} color="bg-electric" testid="admin-stat-services" />
            <StatCard icon={Boxes} label="المشاريع" published={stats.projects.published} total={stats.projects.total} color="bg-navy-600" testid="admin-stat-projects" />
            <StatCard icon={Route} label="نماذج التنفيذ" published={stats.delivery_models.published} total={stats.delivery_models.total} color="bg-navy-800" testid="admin-stat-models" />
            <StatCard icon={FileX2} label="عناصر غير منشورة" published={drafts} total={drafts} note="مسودات مخفية عن الزوار" color="bg-amber-500" testid="admin-stat-drafts" />
          </div>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <StatCard icon={Users} label="المستخدمون" published={stats.users.total} total={stats.users.total} note={`${stats.users.admins} مدير • ${stats.users.editors} محرر${stats.users.inactive ? ` • ${stats.users.inactive} موقوف` : ""}`} color="bg-emerald-600" testid="admin-stat-users" />
            <StatCard icon={Images} label="الصور المرفوعة" published={stats.files} total={stats.files} note="صور مخزنة في التخزين السحابي" color="bg-sky-600" testid="admin-stat-files" />
            <StatCard icon={DatabaseBackup} label="آخر نسخة احتياطية" published={stats.last_backup ? fmtDate(stats.last_backup) : "—"} total={0} note={stats.last_backup ? "تم تنزيلها من صفحة النسخ الاحتياطي" : "لم تُنشأ نسخة احتياطية بعد"} color="bg-slate-700" testid="admin-stat-backup" />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="font-heading text-lg font-bold text-slate-900">روابط سريعة</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link to="/admin/services" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700 transition-all hover:border-electric/40 hover:text-electric" data-testid="admin-quick-services">
                  <Briefcase className="h-5 w-5 text-electric" />
                  إدارة الخدمات
                </Link>
                <Link to="/admin/projects" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700 transition-all hover:border-electric/40 hover:text-electric" data-testid="admin-quick-projects">
                  <Boxes className="h-5 w-5 text-electric" />
                  إدارة المشاريع
                </Link>
                <Link to="/admin/models" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700 transition-all hover:border-electric/40 hover:text-electric" data-testid="admin-quick-models">
                  <Route className="h-5 w-5 text-electric" />
                  نماذج التنفيذ
                </Link>
                <Link to="/admin/settings" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700 transition-all hover:border-electric/40 hover:text-electric" data-testid="admin-quick-settings">
                  <FileX2 className="h-5 w-5 text-electric" />
                  بيانات الشركة
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-slate-900">
                <History className="h-5 w-5 text-electric" />
                آخر التعديلات الإدارية
              </h2>
              {stats.activity.length === 0 ? (
                <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-400" data-testid="admin-activity-empty">
                  لا توجد تعديلات مسجلة بعد — سيظهر سجل التغييرات هنا بعد أول عملية إدارية.
                </p>
              ) : (
                <ul className="mt-4 space-y-2.5" data-testid="admin-activity-list">
                  {stats.activity.map((a, i) => (
                    <li key={a.id || i} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-2.5 text-sm" data-testid={`admin-activity-${i}`}>
                      <span className="font-medium text-slate-700">
                        <span className={`inline-block me-2 rounded-md px-2 py-0.5 text-xs font-bold ${
                          a.action === "delete" ? "bg-red-100 text-red-700" : a.action === "create" ? "bg-emerald-100 text-emerald-700" : "bg-electric-50 text-electric"
                        }`}>
                          {ACTION_LABELS[a.action] || a.action}
                        </span>
                        {ENTITY_LABELS[a.entity] || a.entity}: {a.name}
                      </span>
                      <span className="shrink-0 text-xs text-slate-400">{fmtDate(a.created_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
