import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ShieldCheck, UserCog } from "lucide-react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Field, inputCls, ConfirmAction, PageTitle } from "@/components/admin/AdminUI";
import { fmtDate } from "@/lib/api";

const EMPTY = { name: "", email: "", password: "", role: "editor", active: true };
const ROLE_LABEL = { admin: "مدير", editor: "محرر" };

function UserForm({ open, onOpenChange, editing, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(editing ? { ...EMPTY, ...editing, password: "" } : EMPTY);
  }, [open, editing]);

  const submit = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return toast.error("الاسم يجب أن يكون حرفين على الأقل");
    if (!editing && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) return toast.error("صيغة البريد الإلكتروني غير صحيحة");
    if ((!editing || form.password) && form.password.length < 8) return toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
    setSaving(true);
    try {
      if (editing) {
        const payload = { name: form.name, role: form.role, active: form.active };
        if (form.password) payload.password = form.password;
        await api.put(`/admin/users/${editing.id}`, payload);
        toast.success("تم تحديث بيانات المستخدم");
      } else {
        await api.post("/admin/users", { name: form.name, email: form.email, password: form.password, role: form.role });
        toast.success("تمت إضافة المستخدم بنجاح");
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(formatApiError(err));
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-lg" data-testid="admin-user-form-dialog">
        <DialogHeader>
          <DialogTitle className="text-right">{editing ? "تعديل المستخدم" : "إضافة مستخدم جديد"}</DialogTitle>
          <DialogDescription className="text-right">المدير يتحكم بكل شيء، والمحرر يدير المحتوى فقط.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="الاسم *">
            <input className={inputCls} maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="admin-user-form-name" />
          </Field>
          <Field label="البريد الإلكتروني *">
            <input dir="ltr" type="email" disabled={Boolean(editing)} className={`${inputCls} disabled:bg-slate-100`} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="admin-user-form-email" />
          </Field>
          <Field label={editing ? "كلمة مرور جديدة (اتركها فارغة دون تغيير)" : "كلمة المرور *"} hint="8 أحرف على الأقل">
            <input dir="ltr" type="password" autoComplete="new-password" className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} data-testid="admin-user-form-password" />
          </Field>
          <Field label="الصلاحية">
            <Select dir="rtl" value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
              <SelectTrigger className="h-11" data-testid="admin-user-form-role"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin" data-testid="role-option-admin">مدير — صلاحيات كاملة</SelectItem>
                <SelectItem value="editor" data-testid="role-option-editor">محرر — إدارة المحتوى فقط</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {editing && (
            <label className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm font-bold text-slate-700">
              الحساب نشط
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} data-testid="admin-user-form-active" />
            </label>
          )}
          <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-60" data-testid="admin-user-form-submit">
            {saving ? "جارٍ الحفظ…" : editing ? "حفظ التعديلات" : "إضافة المستخدم"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UserRow({ u, isMe, onEdit, onDelete }) {
  return (
    <tr className="border-t border-slate-100" data-testid={`admin-user-row-${u.id}`}>
      <td className="p-3 sm:p-4">
        <div className="font-bold text-slate-900">{u.name}{isMe && <span className="ms-2 text-xs text-electric">(أنت)</span>}{!u.active && <span className="ms-2 text-xs text-red-600 sm:hidden">موقوف</span>}</div>
        <div className="max-w-[150px] break-all text-xs text-slate-500 sm:max-w-none" dir="ltr">{u.email}</div>
      </td>
      <td className="p-3 sm:p-4">
        <span className={`chip ${u.role === "admin" ? "border-electric/30 bg-electric-50 text-electric" : "border-slate-300 bg-slate-50 text-slate-600"}`} data-testid={`admin-user-role-${u.id}`}>
          {u.role === "admin" ? <ShieldCheck className="h-3.5 w-3.5" /> : <UserCog className="h-3.5 w-3.5" />}
          {ROLE_LABEL[u.role] || u.role}
        </span>
      </td>
      <td className="hidden p-3 sm:table-cell sm:p-4">
        <span className={`chip ${u.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-600"}`} data-testid={`admin-user-status-${u.id}`}>
          {u.active ? "نشط" : "موقوف"}
        </span>
      </td>
      <td className="hidden p-3 text-xs text-slate-500 sm:p-4 md:table-cell">{fmtDate(u.created_at)}</td>
      <td className="p-3 sm:p-4">
        <div className="flex gap-1.5">
          <button onClick={onEdit} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:border-electric hover:text-electric" aria-label="تعديل" data-testid={`admin-user-edit-${u.id}`}><Pencil className="h-4 w-4" /></button>
          {!isMe && <button onClick={onDelete} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:border-red-300 hover:text-red-600" aria-label="حذف" data-testid={`admin-user-delete-${u.id}`}><Trash2 className="h-4 w-4" /></button>}
        </div>
      </td>
    </tr>
  );
}

export default function UsersAdmin() {
  const { user } = useAdminAuth();
  const [users, setUsers] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/users");
      setUsers(data);
    } catch (err) {
      toast.error(formatApiError(err));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = async () => {
    try {
      await api.delete(`/admin/users/${deleting.id}`);
      toast.success("تم حذف المستخدم");
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
    setDeleting(null);
  };

  return (
    <div data-testid="admin-users-page">
      <PageTitle title="إدارة المستخدمين" desc={`${users.length} حساب — ${users.filter((u) => u.role === "admin").length} مدير و${users.filter((u) => u.role === "editor").length} محرر`}>
        <button onClick={() => { setEditing(null); setFormOpen(true); }} className="btn-primary !px-5 !py-2.5 !text-xs" data-testid="admin-user-add-button">
          <Plus className="h-4 w-4" />
          إضافة مستخدم
        </button>
      </PageTitle>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="p-3 text-start font-bold sm:p-4">المستخدم</th>
              <th className="p-3 text-start font-bold sm:p-4">الصلاحية</th>
              <th className="hidden p-3 text-start font-bold sm:table-cell sm:p-4">الحالة</th>
              <th className="hidden p-3 text-start font-bold sm:p-4 md:table-cell">تاريخ الإنشاء</th>
              <th className="p-3 text-start font-bold sm:p-4">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <UserRow key={u.id} u={u} isMe={u.id === user?.id} onEdit={() => { setEditing(u); setFormOpen(true); }} onDelete={() => setDeleting(u)} />
            ))}
          </tbody>
        </table>
      </div>
      <UserForm open={formOpen} onOpenChange={setFormOpen} editing={editing} onSaved={load} />
      <ConfirmAction open={Boolean(deleting)} onOpenChange={(o) => !o && setDeleting(null)} title="حذف المستخدم"
        description={`هل أنت متأكد من حذف حساب «${deleting?.name || ""}»؟ لن يتمكن من الدخول مجددًا.`} confirmLabel="نعم، احذف" onConfirm={remove} testid="admin-user-delete" />
    </div>
  );
}
