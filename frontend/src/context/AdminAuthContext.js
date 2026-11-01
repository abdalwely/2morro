import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api, { setAuthToken, formatApiError } from "@/lib/api";
import { toast } from "sonner";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  // undefined = checking session, null = not logged in, object = logged in
  const [user, setUser] = useState(undefined);
  const { pathname } = useLocation();
  const inAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    if (!inAdmin || user !== undefined) return;
    api
      .get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => setUser(null));
  }, [inAdmin, user]);

  const login = async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setAuthToken(data.access_token);
      setUser(data.user);
      toast.success("تم تسجيل الدخول بنجاح");
      return true;
    } catch (e) {
      toast.error(formatApiError(e));
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout request failed", error);
    }
    setAuthToken(null);
    setUser(null);
  };

  return (
    <AdminAuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}

export function AdminOnly({ children }) {
  const { user } = useAdminAuth();
  if (user?.role !== "admin") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center text-sm font-bold text-amber-800" data-testid="admin-only-notice">
        هذه الصفحة متاحة لمدير الموقع فقط.
      </div>
    );
  }
  return children;
}

export function RequireAdmin({ children }) {
  const { user } = useAdminAuth();
  if (user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-900">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-electric border-t-transparent" data-testid="admin-auth-loading" />
      </div>
    );
  }
  if (!user) return <NavigateToLogin />;
  return children;
}

function NavigateToLogin() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/admin/login", { replace: true });
  }, [navigate]);
  return null;
}
