import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, ArrowLeft } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useSEO } from "@/hooks/useSEO";

export default function AdminLogin() {
  const { user, login } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  useSEO({ title: "تسجيل دخول المسؤول | لوحة التحكم", description: "تسجيل دخول لوحة التحكم الإدارية." });

  useEffect(() => {
    if (user) navigate("/admin", { replace: true });
  }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    const ok = await login(email.trim(), password);
    setLoading(false);
    if (ok) navigate("/admin", { replace: true });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy-900 p-4" data-testid="admin-login-page">
      <div className="grid-pattern absolute inset-0" aria-hidden="true" />
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-electric/20 blur-[110px]" aria-hidden="true" />

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-navy-800/80 p-8 shadow-2xl backdrop-blur-xl">
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-electric font-heading text-xl font-black text-white">2M</span>
          <h1 className="mt-4 font-heading text-2xl font-extrabold text-white" data-testid="admin-login-title">لوحة التحكم الإدارية</h1>
          <p className="mt-1.5 text-sm text-slate-400">2Morro Technically Solutions — دخول المسؤولين فقط</p>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-5" data-testid="admin-login-form">
          <div>
            <label htmlFor="admin-email" className="mb-1.5 block text-sm font-bold text-slate-200">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                dir="ltr"
                className="w-full rounded-lg border border-white/15 bg-navy-900/60 px-10 py-3 text-sm text-white placeholder:text-slate-500 focus:border-electric focus:outline-none focus:ring-2 focus:ring-electric/40"
                data-testid="admin-login-email-input"
              />
            </div>
          </div>

          <div>
            <label htmlFor="admin-password" className="mb-1.5 block text-sm font-bold text-slate-200">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-white/15 bg-navy-900/60 px-10 py-3 text-sm text-white placeholder:text-slate-500 focus:border-electric focus:outline-none focus:ring-2 focus:ring-electric/40"
                data-testid="admin-login-password-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-electric py-3 text-sm font-bold text-white transition-all duration-300 hover:bg-electric-600 hover:shadow-lg hover:shadow-electric/30 disabled:opacity-60"
            data-testid="admin-login-submit-button"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            {loading ? "جارٍ تسجيل الدخول…" : "تسجيل الدخول"}
          </button>
        </form>

        <Link to="/" className="mt-6 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400 transition-colors hover:text-aqua" data-testid="admin-login-back-home">
          <ArrowLeft className="h-3.5 w-3.5" />
          العودة إلى الموقع الرئيسي
        </Link>
      </div>
    </div>
  );
}
